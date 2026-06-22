"""
Solar Analytics - Data Science & Predictive Analysis Module
Uses PyScript to run Python-based calculations in the browser
"""

import json
from js import document, window
from datetime import datetime, timedelta

# Import optional but recommended libraries if available
try:
    import numpy as np
    HAS_NUMPY = True
except:
    HAS_NUMPY = False

try:
    import pandas as pd
    HAS_PANDAS = True
except:
    HAS_PANDAS = False


class SolarAnalytics:
    """Main class for solar energy analytics and predictions"""
    
    def __init__(self):
        self.CO2_PER_KWH = 0.4
        self.BATTERY_EFFICIENCY = 0.95
        self.INVERTER_EFFICIENCY = 0.98
        
    def parse_csv_data(self, csv_text):
        """Parse CSV text into structured data"""
        if HAS_PANDAS:
            import io
            df = pd.read_csv(io.StringIO(csv_text))
            return df.to_dict('records')
        else:
            # Fallback: simple CSV parsing
            lines = csv_text.strip().split('\n')
            headers = [h.strip() for h in lines[0].split(',')]
            data = []
            for line in lines[1:]:
                values = line.split(',')
                row = {}
                for i, header in enumerate(headers):
                    try:
                        row[header] = float(values[i]) if values[i] else 0
                    except:
                        row[header] = values[i]
                data.append(row)
            return data
    
    def predict_pv_generation(self, historical_data, weather_forecast, days=7):
        """
        ARIMA-like prediction using exponential smoothing
        Predicts PV generation based on historical patterns and weather
        """
        if not historical_data:
            return []
        
        # Extract PV values
        pv_values = [d.get('pv', 0) for d in historical_data]
        
        if len(pv_values) == 0:
            return []
        
        predictions = []
        last_pv = pv_values[-1] if pv_values else 0
        avg_pv = sum(pv_values) / len(pv_values)
        
        for day in range(days):
            # Apply exponential smoothing with weather factor
            alpha = 0.3
            weather_factor = 1.0
            
            if HAS_NUMPY and weather_forecast and day < len(weather_forecast):
                cloud_cover = weather_forecast[day].get('cloudCover', 0.5)
                weather_factor = max(0.1, 1 - cloud_cover)
            
            # Exponential smoothing prediction
            predicted_pv = (alpha * last_pv + (1 - alpha) * avg_pv) * weather_factor
            predictions.append({
                'day': day + 1,
                'predicted_pv': round(predicted_pv, 2),
                'weather_factor': round(weather_factor, 2)
            })
            
            last_pv = predicted_pv
        
        return predictions
    
    def predict_battery_behavior(self, historical_data, predictions=None):
        """
        Predict battery charge/discharge patterns
        Uses load and PV generation correlation
        """
        if not historical_data:
            return {}
        
        load_values = [d.get('load', 0) for d in historical_data]
        pv_values = [d.get('pv', 0) for d in historical_data]
        soc_values = [d.get('soc', 50) for d in historical_data]
        
        avg_load = sum(load_values) / len(load_values) if load_values else 0
        avg_pv = sum(pv_values) / len(pv_values) if pv_values else 0
        avg_soc = sum(soc_values) / len(soc_values) if soc_values else 50
        
        # Calculate charge/discharge rates
        charge_rate = max(0, (avg_pv - avg_load) * 0.6)  # 60% efficiency
        discharge_rate = max(0, (avg_load - avg_pv) * 0.7)  # 70% efficiency
        
        return {
            'avg_load': round(avg_load, 2),
            'avg_pv': round(avg_pv, 2),
            'avg_soc': round(avg_soc, 2),
            'charge_rate': round(charge_rate, 2),
            'discharge_rate': round(discharge_rate, 2),
            'optimal_soc_range': [40, 80],
            'battery_cycles_estimated': round(len(historical_data) / 96, 1)  # 5-min intervals
        }
    
    def calculate_advanced_metrics(self, historical_data):
        """Calculate advanced energy metrics using statistical analysis"""
        if not historical_data or len(historical_data) == 0:
            return {}
        
        pv_values = [d.get('pv', 0) for d in historical_data]
        load_values = [d.get('load', 0) for d in historical_data]
        grid_values = [d.get('grid', 0) for d in historical_data]
        
        # Calculate standard deviations for variability
        if HAS_NUMPY:
            pv_std = float(np.std(pv_values)) if pv_values else 0
            load_std = float(np.std(load_values)) if load_values else 0
        else:
            # Manual std calculation
            avg_pv = sum(pv_values) / len(pv_values) if pv_values else 0
            avg_load = sum(load_values) / len(load_values) if load_values else 0
            pv_std = (sum((x - avg_pv) ** 2 for x in pv_values) / len(pv_values)) ** 0.5 if pv_values else 0
            load_std = (sum((x - avg_load) ** 2 for x in load_values) / len(load_values)) ** 0.5 if load_values else 0
        
        # Calculate correlations
        total_pv = sum(pv_values)
        total_load = sum(load_values)
        total_grid_export = sum(max(0, -x) for x in grid_values)
        total_grid_import = sum(max(0, x) for x in grid_values)
        
        self_consumption = (total_pv - total_grid_export) / total_pv if total_pv > 0 else 0
        grid_dependency = total_grid_import / total_load if total_load > 0 else 0
        
        return {
            'pv_variability': round(pv_std, 2),
            'load_variability': round(load_std, 2),
            'self_consumption_ratio': round(self_consumption * 100, 2),
            'grid_dependency_ratio': round(grid_dependency * 100, 2),
            'total_pv_generated': round(total_pv / 1000, 2),  # Convert to kWh
            'total_load': round(total_load / 1000, 2),
            'total_grid_export': round(total_grid_export / 1000, 2),
            'total_grid_import': round(total_grid_import / 1000, 2),
        }
    
    def forecast_financial_impact(self, historical_data, electricity_rate, feed_in_rate, years=25):
        """
        Generate financial projections with degradation modeling
        """
        daily_metrics = self.calculate_advanced_metrics(historical_data)
        
        daily_pv = daily_metrics.get('total_pv_generated', 0)
        annual_pv = daily_pv * 365
        
        annual_savings = []
        cumulative_savings = 0
        
        for year in range(years):
            # Apply panel degradation (0.5% per year)
            degradation_factor = (1 - 0.005) ** year
            year_pv = annual_pv * degradation_factor
            
            # Calculate savings
            feed_in_revenue = year_pv * 0.3 * feed_in_rate  # Assume 30% feed-in
            consumption_savings = year_pv * 0.7 * electricity_rate  # 70% self-consumption
            
            total_year_savings = feed_in_revenue + consumption_savings
            cumulative_savings += total_year_savings
            
            annual_savings.append({
                'year': year + 1,
                'annual_pv': round(year_pv, 2),
                'annual_savings': round(total_year_savings, 2),
                'cumulative_savings': round(cumulative_savings, 2),
                'degradation_factor': round(degradation_factor, 4)
            })
        
        return annual_savings
    
    def optimize_battery_schedule(self, historical_data, electricity_rate, peak_hours=[(18, 21)]):
        """
        Optimize battery charging/discharging schedule based on time-of-use rates
        """
        battery_behavior = self.predict_battery_behavior(historical_data)
        
        optimization_strategy = {
            'charge_strategy': 'Charge during peak solar hours (9-15)',
            'discharge_strategy': 'Discharge during peak rate hours (18-21)',
            'optimal_soc_morning': 80,
            'optimal_soc_evening': 40,
            'expected_daily_cycles': round(battery_behavior['battery_cycles_estimated'], 2),
            'estimated_battery_life_years': round(5000 / (battery_behavior['battery_cycles_estimated'] * 365), 1),
            'cost_saving_potential': f"₱{round(battery_behavior['discharge_rate'] * electricity_rate * 365 * 0.2, 0)}/year",
        }
        
        return optimization_strategy


# Create global instance
solar_analytics = SolarAnalytics()


# JavaScript bridge functions
def run_pv_prediction(data_json, weather_json, days=7):
    """Bridge function: Run PV prediction from JavaScript"""
    try:
        data = json.loads(data_json)
        weather = json.loads(weather_json) if weather_json else []
        result = solar_analytics.predict_pv_generation(data, weather, days)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({'error': str(e)})


def run_battery_analysis(data_json):
    """Bridge function: Run battery analysis from JavaScript"""
    try:
        data = json.loads(data_json)
        result = solar_analytics.predict_battery_behavior(data)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({'error': str(e)})


def run_advanced_metrics(data_json):
    """Bridge function: Calculate advanced metrics"""
    try:
        data = json.loads(data_json)
        result = solar_analytics.calculate_advanced_metrics(data)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({'error': str(e)})


def run_financial_forecast(data_json, electricity_rate, feed_in_rate, years=25):
    """Bridge function: Generate financial forecast"""
    try:
        data = json.loads(data_json)
        result = solar_analytics.forecast_financial_impact(data, electricity_rate, feed_in_rate, years)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({'error': str(e)})


def run_battery_optimization(data_json, electricity_rate):
    """Bridge function: Optimize battery schedule"""
    try:
        data = json.loads(data_json)
        result = solar_analytics.optimize_battery_schedule(data, electricity_rate)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({'error': str(e)})


# Expose to JavaScript
window.solarAnalyticsPy = {
    'run_pv_prediction': run_pv_prediction,
    'run_battery_analysis': run_battery_analysis,
    'run_advanced_metrics': run_advanced_metrics,
    'run_financial_forecast': run_financial_forecast,
    'run_battery_optimization': run_battery_optimization,
}