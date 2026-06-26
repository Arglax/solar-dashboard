// ============================================================
// Data Processor - CSV parsing and format detection
// ============================================================

const DataProcessor = (() => {
    /**
     * Detect CSV format (daily or weekly)
     */
    function detectFormat(headers) {
        const headerStr = headers.join(',').toLowerCase();
        
        const dailyPatterns = ['soc', 'battery soc', 'battery(', 'load(w)', 'pv(w)'];
        const weeklyPatterns = ['battery charge', 'battery discharge', 'feed-in', 'purchase', 'pv(kwh)'];
        
        const isDailyMatch = dailyPatterns.some(p => headerStr.includes(p));
        const isWeeklyMatch = weeklyPatterns.some(p => headerStr.includes(p));
        
        if (isDailyMatch) return 'daily';
        if (isWeeklyMatch) return 'weekly';
        
        // Fallback: try to infer from column count and names
        if (headers.length <= 6) return 'daily';
        return 'weekly';
    }

    /**
     * Normalize daily data
     */
    function normalizeDailyData(data, headers) {
        return data.map((row, idx) => {
            // Find matching columns (case-insensitive)
            const findCol = (patterns) => {
                const key = Object.keys(row).find(k => 
                    patterns.some(p => k.toLowerCase().includes(p.toLowerCase()))
                );
                return key ? row[key] : 0;
            };

            return {
                time: findCol(['time', 'timestamp']) || `${idx}:00`,
                pv: parseFloat(findCol(['pv', 'generation', 'solar'])) || 0,
                grid: parseFloat(findCol(['grid', 'import', 'export'])) || 0,
                battery: parseFloat(findCol(['battery', 'batt', 'bms'])) || 0,
                load: parseFloat(findCol(['load', 'consumption', 'usage'])) || 0,
                soc: parseFloat(findCol(['soc', 'state of charge'])) || 0
            };
        }).filter(row => Object.values(row).some(v => v !== 0 && v !== ''));
    }

    /**
     * Normalize weekly data
     */
    function normalizeWeeklyData(data, headers) {
        return data.map(row => {
            const findCol = (patterns) => {
                const key = Object.keys(row).find(k => 
                    patterns.some(p => k.toLowerCase().includes(p.toLowerCase()))
                );
                return key ? row[key] : 0;
            };

            return {
                date: findCol(['date', 'time', 'day']) || '',
                pv: parseFloat(findCol(['pv', 'generation', 'solar'])) || 0,
                purchase: parseFloat(findCol(['purchase', 'import', 'grid purchase'])) || 0,
                feedIn: parseFloat(findCol(['feed', 'feed-in', 'export'])) || 0,
                charge: parseFloat(findCol(['charge', 'battery charge'])) || 0,
                discharge: parseFloat(findCol(['discharge', 'battery discharge'])) || 0,
                load: parseFloat(findCol(['load', 'consumption', 'usage'])) || 0
            };
        }).filter(row => Object.values(row).some(v => v !== 0 && v !== ''));
    }

    /**
     * Generate predictive weekly forecast from daily data
     */
    function generatePredictiveWeekly(dailyData, weatherForecast = []) {
        if (!dailyData || dailyData.length === 0) return [];

        const weeklyData = [];
        const daysInWeek = 7;

        // Calculate daily statistics
        const avgPVPerInterval = dailyData.reduce((sum, d) => sum + d.pv, 0) / dailyData.length;
        const avgLoadPerInterval = dailyData.reduce((sum, d) => sum + d.load, 0) / dailyData.length;
        
        // Convert intervals to daily (assuming 5-minute intervals = 288 per day)
        const dailyPVkWh = (avgPVPerInterval * 288) / 1000;
        const dailyLoadkWh = (avgLoadPerInterval * 288) / 1000;

        for (let i = 0; i < daysInWeek; i++) {
            const weather = weatherForecast[i] || {};
            const cloudCover = weather.cloudCover || 0.5;
            const temp = weather.temp || 25;

            // Weather adjustments
            const tempFactor = Math.max(0.8, 1 - Math.abs(temp - 25) * 0.01);
            const weatherFactor = Math.max(0.2, 1 - cloudCover);
            
            const predictedPV = dailyPVkWh * weatherFactor * tempFactor;
            const predictedLoad = dailyLoadkWh;

            const charge = Math.max(0, (predictedPV - predictedLoad) * 0.6);
            const discharge = Math.max(0, (predictedLoad - predictedPV) * 0.4);
            const purchase = Math.max(0, predictedLoad - predictedPV);
            const feedIn = Math.max(0, predictedPV - predictedLoad);

            weeklyData.push({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                pv: Math.round(predictedPV * 100) / 100,
                purchase: Math.round(purchase * 100) / 100,
                feedIn: Math.round(feedIn * 100) / 100,
                charge: Math.round(charge * 100) / 100,
                discharge: Math.round(discharge * 100) / 100,
                load: Math.round(predictedLoad * 100) / 100,
                isPredicted: true
            });
        }

        return weeklyData;
    }

    return {
        /**
         * Main processing function
         */
        processFile(rawData, headers) {
            if (!rawData || !headers || headers.length === 0) {
                throw new Error('Invalid data or headers');
            }

            const format = detectFormat(headers);

            if (!format) {
                throw new Error('Unrecognized CSV format. Expected daily (Time, PV, Load, SOC) or weekly (Date, PV, Purchase, Feed-in)');
            }

            let normalized;
            if (format === 'daily') {
                normalized = normalizeDailyData(rawData, headers);
            } else {
                normalized = normalizeWeeklyData(rawData, headers);
            }

            if (normalized.length === 0) {
                throw new Error('No valid data rows found after processing');
            }

            return {
                format,
                data: normalized,
                rawHeaders: headers,
                rowCount: normalized.length
            };
        },

        /**
         * Generate weekly forecast from daily data
         */
        generateWeeklyForecast(dailyData, weatherForecast = []) {
            return generatePredictiveWeekly(dailyData, weatherForecast);
        },

        /**
         * Calculate daily statistics
         */
        calculateDailyStats(data) {
            if (!data || data.length === 0) return null;

            return {
                totalPV: data.reduce((sum, d) => sum + (d.pv || 0), 0),
                totalLoad: data.reduce((sum, d) => sum + (d.load || 0), 0),
                avgPV: data.reduce((sum, d) => sum + (d.pv || 0), 0) / data.length,
                avgLoad: data.reduce((sum, d) => sum + (d.load || 0), 0) / data.length,
                maxPV: Math.max(...data.map(d => d.pv || 0)),
                maxLoad: Math.max(...data.map(d => d.load || 0)),
                minPV: Math.min(...data.map(d => d.pv || 0)),
                minLoad: Math.min(...data.map(d => d.load || 0))
            };
        }
    };
})();
