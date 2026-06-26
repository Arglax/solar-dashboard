>[!WARNING]
> I am not, in any way, affiliated to SUNGROW. All tools are created and provided by me with no means of actively profiting and advertising this project, especially outside voluntary donations.

>[!NOTE]
> Limited to SUNGROW monitoring app in the meantime.

---
# Solar Analytics Dashboard v1.0.1
## PV + BESS Intelligence Platform
Contact: arglaxaqw@gmail.com

---

## 📋 Overview

A professional, fully-responsive web-based solar energy analytics dashboard for monitoring and optimizing Sungrow PV + Battery systems. Features real-time metrics, ROI calculations, battery optimization analysis, and multi-source weather forecasting.

### Key Features

✅ **CSV Data Import** - Drag & drop or select Sungrow daily/weekly reports  
✅ **Real-time Metrics** - PV generation, battery SOC, load, grid flow  
✅ **Interactive Charts** - PV timeline, battery state, energy flow, load demand  
✅ **Battery Optimization** - Charge/discharge windows, feed-in potential, weekly/monthly projections  
✅ **ROI Calculator** - Payback period, annual savings, 25-year value, CO₂ offset  
✅ **Weather Integration** - Multi-source forecasting (Open-Meteo, OpenWeatherMap, WeatherAPI, wttr.in)  
✅ **Professional Export** - Download as PNG, HTML, or CSV  
✅ **Fully Responsive** - Desktop, tablet, and mobile-optimized  
✅ **Dark Mode UI** - Professional glassmorphic design with solar theme  

---

## 🚀 Quick Start

### Installation

1. **Create project folder structure:**
```
solar-analytics/
├── index.html
├── js/
│   ├── main.js
│   ├── data-processor.js
│   ├── weather-predictor.js
│   ├── battery-optimizer.js
│   ├── ui-manager.js
│   └── tooltip.js
└── css/ (optional, CSS is inline)
```

2. **Copy all files provided** to their respective locations

3. **Open `index.html` in a web browser**

### No Dependencies Required
- All external libraries loaded via CDN
- Works offline (fallback to mock weather data)
- No backend server needed

---

## 📊 Data Format Support

### Daily Format (5-minute intervals)
```csv
Time,PV(W),Grid(W),Battery(W),Load(W),Battery SOC(%)
09:00,1200,-50,0,1250,75
09:05,1250,100,0,1150,75
...
```

### Weekly Format
```csv
Time,PV(kWh),Energy purchase(kWh),Feed-in(kWh),Battery charge(kWh),Battery discharge(kWh),Load(kWh)
2024-01-01,12.5,3.2,2.1,6.0,4.5,9.7
...
```

**Supported Column Names (case-insensitive):**
- PV: `PV`, `Generation`, `Solar`
- Load: `Load`, `Consumption`, `Usage`
- Battery: `Battery`, `SOC`, `State of Charge`
- Grid: `Grid`, `Import`, `Export`

---

## 🎯 Main Features Explained

### 1. System Overview
Real-time energy flow visualization showing:
- Current PV generation (W)
- Battery state of charge (%)
- System load (W)
- Grid import/export (W)

### 2. Metrics Dashboard
**Basic Metrics:**
- PV Generation - Current/average solar output
- Battery SOC - Current battery level
- System Load - Current consumption
- Grid Import/Export - Net grid flow

**Advanced Metrics:**
- Energy Efficiency - % of solar being used
- Grid Independence - % energy not from grid
- Daily Savings - Estimated cost savings
- CO₂ Offset - Environmental impact

### 3. Charts
- **PV Generation Timeline** - Solar output over time
- **Battery State of Charge** - Battery charging/discharging
- **Energy Flow Analysis** - PV vs Load comparison
- **System Load Demand** - Consumption patterns

### 4. Battery Optimizer
Analyzes battery performance and provides:
- Optimal charge windows (top 5)
- Optimal discharge windows (top 5)
- Grid feed-in revenue potential
- Weekly/monthly projections
- Cost-saving recommendations

**Output Formats:**
- Text report (pre-formatted analysis)
- Table view (structured data)
- Chart view (visual representation)

### 5. ROI Calculator
Projects financial returns based on:
- System installation cost
- Electricity rates
- Feed-in rates
- Equipment degradation

**Outputs:**
- Payback period (years)
- Annual savings (PHP)
- 25-year lifetime value (PHP)
- CO₂ offset over 25 years

### 6. Data Table
Displays detailed raw data from CSV:
- Searchable/sortable (browser native)
- Last 50 rows shown (performance)
- All original columns preserved

---

## 🌐 Weather Data Sources

**Automatic fallback chain:**
1. Open-Meteo (free, no key required) ✓
2. OpenWeatherMap (free tier available)
3. WeatherAPI.com (free tier available)
4. wttr.in (free, no key required)
5. Mock data (offline fallback)

**Supported for location:** Quezon City, Philippines (14.5995°N, 120.9842°E)

To modify location, edit in `main.js` line ~350:
```javascript
const lat = 14.5995;  // Your latitude
const lon = 120.9842; // Your longitude
```

---

## 📱 Mobile & Responsive

- ✅ **Tablet** (768px): 2-column metrics, stacked charts
- ✅ **Mobile** (520px): Single-column layout, optimized spacing
- ✅ **Touch**: Drag-drop file upload, tap tooltips
- ✅ **Dark mode**: OLED-friendly (#0F1419 background)

---

## 💾 Data Export

### Dashboard (PNG)
- Exports entire dashboard as high-resolution image
- Preserves colors and layout
- ~1.5x scale for quality

### CSV Export
- Downloads processed data in CSV format
- Includes all normalized columns
- Filename: `solar-data-YYYY-MM-DD.csv`

### Chart Export
- Individual charts as PNG
- Each chart button has download option
- Separate files for: PV, SOC, Energy Flow, Load

---

## ⚙️ Configuration

### Unit Settings (Bottom-right menu)
- Energy Unit: Watts (W) / Kilowatts (kW)
- Daily Energy: Wh / kWh / MWh
- Emissions: kg / Metric Tons / grams
- Mock Weather: Force mock data for testing

**Settings stored in localStorage** - persists across sessions

### Electricity Rates (Calculator)
Default values pre-filled:
- Electricity Rate: ₱11.50/kWh (Philippines average)
- Feed-in Rate: ₱5.75/kWh (typical export rate)
- Degradation: 0.5%/year (solar panels)

---

## 🔧 Technical Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- Chart.js for visualizations
- Papa Parse for CSV processing
- html2canvas for exports
- jszip for file operations

**Browser Support:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

---

## 📈 Algorithm Details

### Battery Optimization
- **Charge windows**: Identifies PV > Load periods with SOC < 95%
- **Discharge windows**: Identifies Load > PV periods with SOC > 20%
- **Feed-in potential**: Calculates excess when battery is full
- **Projections**: Multiplies daily patterns by 7 and 4.33 for weekly/monthly

### ROI Calculation
```
Annual Savings = (Annual PV * 0.7 * Electricity Rate) + (Annual PV * 0.3 * Feed-in Rate)
Payback Period = System Cost / Annual Savings
25-Year Value = Annual Savings * 25 * (1 - Degradation)^year
```

### Weather Impact
```
Predicted PV = Daily Avg PV * Weather Factor * Temperature Factor
Weather Factor = 1 - Cloud Cover
Temperature Factor = 1 - |Temp - 25°C| * 0.01
```

---

## 🐛 Troubleshooting

### "Unrecognized CSV format"
- Ensure headers match expected columns
- Check for special characters in column names
- Verify file encoding is UTF-8

### Charts not rendering
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for errors (F12)
- Ensure Chart.js loaded (check Network tab)

### Weather data not loading
- Check internet connection
- Verify geolocation permissions
- Use "Mock Data" option in units menu

### File upload fails
- Maximum file size: ~10MB
- Supported: CSV files only
- Try Safari/Chrome if Firefox fails

---

## 📞 Support & Contact

**Issues or Suggestions:**
- Email: arglaxaqw@gmail.com
- GitHub: arglax.github.io/Mobile-WuWa-Config

**Feature Requests:**
- Battery scheduling optimization
- Multi-system comparison
- Time-of-use rate integration
- API data import from Sungrow

---

## 📄 License

Personal project by Arglax. Use for educational and personal purposes.

---

## 🙏 Credits

Built with:
- Chart.js - Data visualization
- Papa Parse - CSV processing
- html2canvas - Screenshot capability
- Weather APIs - Forecasting

**Dashboard v0.2.0** | Last Updated: 2024


*Last Updated: June 26, 2026*
*Version: 1.0.1*
