>[!WARNING]
> I am not, in any way, affiliated to SUNGROW. All tools are created and provided by me with no means of actively profiting and advertising this project, especially outside voluntary donations.

## ⚡ Solar Analytics: PV + BESS Intelligence Platform

Solar Analytics is a lightweight, fully client-side web application designed to parse, analyze, and visualize daily and weekly solar generation and Battery Energy Storage System (BESS) data exported from **Sungrow** inverters.

>[!NOTE]
> Limited to SUNGROW monitoring app in the meantime.

Simply drag and drop your exported CSV reports to instantly unlock real-time energy flow tracking, financial ROI metrics, interactive timelines, and professional reporting tools—**all powered by Python-based data science running directly in your browser**.

---

## 🚀 Key Features

* **Zero-Server CSV Parsing:** Fast, secure, and private client-side processing using `PapaParse`. Your energy data never leaves your browser.
* **Dynamic System Overview:** A real-time energy flow snapshot showing current generation, battery State of Charge (SOC), consumption load, and grid net metrics.
* **Granular Performance Metrics:** 
  * *Basic:* PV Generation, Battery SOC, System Load, and Grid Import/Export with data shift indicators.
  * *Advanced:* System Energy Efficiency, Grid Independence %, Daily Financial Savings, and Carbon (CO₂) Offset metrics.

* **Python-Powered Data Science Engine:** Advanced predictive analytics and optimization algorithms running via **PyScript**:
  * **PV Generation Forecasting:** Exponential smoothing predictions with real-time weather factor integration
  * **Battery Behavior Analysis:** Charge/discharge pattern optimization with cycle estimation
  * **Advanced Metrics:** Statistical variability analysis, self-consumption ratio, and grid dependency metrics
  * **Financial Forecasting:** 25-year ROI projections with hardware degradation modeling
  * **Smart Battery Scheduling:** Time-of-use optimization recommendations

* **Interactive Analytics Panels:** Four independent responsive timelines built with `Chart.js` tracking PV Generation, Battery SOC lifecycle, Stacked Energy Flow, and System Load Demand.
* **Predictive ROI Calculator:** Hybrid JS/Python projections modeling system cost, local utility rates, feed-in tariffs, and equipment hardware degradation over a 25-year cycle.
* **Multi-Format Export Engine:** High-fidelity dashboard exports to `.png` (via `html2canvas`), standalone distribution `.html` reports, or normalized compiled `.csv` spreadsheets.
* **Real-Time Weather Integration:** Automatic forecast fetching from 10+ weather providers (Open-Meteo, WeatherAPI, OpenWeatherMap, etc.) with fallback to mock data.
* **Professional UI/UX:** Dark-mode dashboard with responsive grid layouts, animated loading indicators, and comprehensive tooltips on all metrics.

---

## 🛠️ Tech Stack

### Frontend
* **Structure:** HTML5 (Semantic Layout)
* **Styling:** CSS3 (Dark Mode, Responsive Grid)
* **Interactivity:** Vanilla JavaScript (ES6+)

### Data Processing & Visualization
* **CSV Parsing:** [PapaParse v5.4.1](https://www.papaparse.com/)
* **Charting:** [Chart.js v3.9.1](https://www.chartjs.org/)
* **Export Mechanics:** [html2canvas v1.4.1](https://html2canvas.hertzen.com/) & [JSZip v3.10.1](https://stuk.github.io/jszip/)

### Python Data Science (Browser Runtime)
* **Runtime:** [PyScript](https://pyscript.net/) (via Pyodide - CPython in WebAssembly)
* **Libraries Available:**
  * `numpy` - Numerical computations & statistics
  * `pandas` - Data manipulation & analysis (optional, for enhanced performance)
  * `json` - Data serialization
  * Native Python for statistical analysis & machine learning

### Weather Data
* **Multiple Providers:** Open-Meteo, WeatherAPI.com, WeatherBit, wttr.in, OpenWeatherMap, Tomorrow.io, ClimaCell, Weather.gov, Visual Crossing
* **Fallback:** Mock weather data for offline testing

---

## 📂 Project Architecture
solar-analytics/ ├── index.html                          # Core UI + PyScript integration ├── css/ │   └── styles.css                      # Dark-mode theming & responsive layouts ├── js/ │   ├── main.js                         # ⭐ PRIMARY: All business logic orchestrated here │   ├── data-processor.js               # CSV normalization & weekly forecast generation │   ├── weather-predictor.js            # Weather API integration (10+ providers) │   ├── ui-manager.js                   # UI state & unit conversion management │   ├── tooltip.js                      # Dynamic tooltip system │   └── battery-optimizer.js            # Battery health & cycling analysis ├── py/ │   ├── solar_analytics.py              # ⭐ Python data science module (PyScript runtime) │   └── requirements.txt                # Optional Python dependencies (for reference) └── README.md                           # This file

**Key Files:**
- **`index.html`** - Entry point; loads all scripts and PyScript
- **`js/main.js`** - Orchestrates CSV processing, Python calls, and dashboard updates
- **`py/solar_analytics.py`** - Runs predictive algorithms in browser via PyScript
- **`css/styles.css`** - All styling (dark theme, responsive grid, charts)

> 💡 **Note:** Internet connection required for:
> - Loading CDN libraries (Chart.js, PapaParse, html2canvas, JSZip, PyScript)
> - Weather data fetching
> - First-time PyScript runtime load (~30MB)
> - Subsequent visits use cached runtime

---

## 📥 Data Requirements

The parser auto-detects **Sungrow** CSV format and normalizes data accordingly.

### 1. Daily Reports (5-minute intervals)
Time,PV(W),Battery SOC(%),Load(W),Grid(W),Battery(W) 2024-06-22 06:00:00,0,85,250,-50,0 2024-06-22 06:05:00,50,85,300,100,150 2024-06-22 06:10:00,150,84,350,200,180

**Required Columns:**
* `Time` - Timestamp (ISO 8601 or custom format)
* `PV(W)` - Solar generation in Watts
* `Battery SOC(%)` - Battery state of charge (0-100%)
* `Load(W)` - System load in Watts
* `Grid(W)` - Grid import (+) / export (-) in Watts
* `Battery(W)` - Battery charge/discharge in Watts

### 2. Weekly Reports (daily aggregation)

Time,PV(kWh),Battery charge(kWh),Battery discharge(kWh),Energy purchase(kWh),Feed-in(kWh),Load(kWh) 2024-06-15,12.5,8.0,6.5,2.3,4.2,15.8 2024-06-16,14.2,9.1,7.2,1.8,5.3,17.4


**Required Columns:**
* `Time` - Date (YYYY-MM-DD)
* `PV(kWh)` - Daily solar generation
* `Battery charge(kWh)` - Battery charging energy
* `Battery discharge(kWh)` - Battery discharging energy
* `Energy purchase(kWh)` - Grid import in kWh
* `Feed-in(kWh)` - Grid export in kWh
* `Load(kWh)` - Total daily consumption

---

## 🚀 Quick Start

### 1. Download & Setup

Clone repository
git clone https://github.com/yourusername/solar-analytics.git cd solar-analytics
Or manually organize files:
solar-analytics/ ├── index.html ├── css/styles.css ├── js/ │   ├── main.js │   ├── data-processor.js │   ├── weather-predictor.js │   ├── ui-manager.js │   ├── tooltip.js │   └── battery-optimizer.js └── py/solar_analytics.py


### 2. Open in Browser

**Desktop Browsers (Recommended):**
- Chrome 90+ (best performance with WebAssembly)
- Safari 14+ (full PyScript support)
- Firefox 88+ (excellent compatibility)
- Edge 90+ (Chromium-based)

**Mobile Browsers:**
- iOS Safari (tested on iOS 14+)
- Chrome Android (tested on Android 9+)

**Steps:**
1. Open `index.html` directly in your browser
2. Allow pop-ups if prompted (for weather API calls)
3. Wait for PyScript runtime to load on first visit (~30 seconds)

### 3. Import CSV Data

1. **Export from Sungrow App:**
   - Open Sungrow iSolarCloud app
   - Navigate to Reports → Daily/Weekly
   - Export as CSV file

2. **Upload to Dashboard:**
   - Drag & drop CSV onto the upload area, OR
   - Click **Choose CSV File** button
   - Wait for the animated loading indicator

3. **Dashboard Auto-Populates:**
   - System Overview with real-time energy flow
   - All metrics and charts render automatically
   - Python analytics run in background

### 4. Customize & Analyze

**ROI Calculator:**
1. Scroll to "System Projections & ROI Calculator"
2. Enter your system cost (₱)
3. Set local electricity rate (₱/kWh)
4. Set feed-in tariff (₱/kWh)
5. Click **Calculate ROI & Projections**

**Unit Preferences:**
1. Click ⚙️ icon in header
2. Toggle between W/kW, Wh/kWh/MWh, kg/ton/g
3. Settings persist in browser

**Weather Forecast:**
1. View "Performance Data & Analytics" section
2. Select weather provider from dropdown
3. Click 🔄 **Retry** to re-fetch forecast
4. Charts update with new weather factors

### 5. Export Reports

**PNG Dashboard:**
Click 📥 Dashboard → Saves entire dashboard as high-res PNG (renders at 2× scale via html2canvas)

**HTML Report:**
Click 📄 HTML → Generates standalone .html file (can be opened offline, includes all data)

**CSV Data:**
Click 📊 CSV → Downloads normalized data (compatible with Excel, Google Sheets, Python pandas)

**Individual Charts:**
Click ⬇️ on any chart card → Downloads chart as PNG (useful for presentations, reports)

---

## 🧪 Python Data Science Module

The `py/solar_analytics.py` module provides 5 core predictive functions:

### 1. PV Generation Forecasting

predict_pv_generation(historical_data, weather_forecast, days=7)

- Calculates charge/discharge rates
- Estimates battery cycles per day
- Recommends optimal SOC range (typically 40-80%)
- Projects battery lifespan

### 3. Advanced Metrics Calculation

calculate_advanced_metrics(historical_data)

- Statistical variability (PV & load std deviation)
- Self-consumption ratio (% of solar used locally)
- Grid dependency ratio (% energy from grid)
- Daily energy totals

### 4. Financial Forecasting
forecast_financial_impact(historical_data, electricity_rate, feed_in_rate, years=25)

- Year-by-year ROI projections
- Panel degradation modeling (0.5%/year typical)
- Feed-in revenue calculations
- Cumulative savings over 25 years

### 5. Battery Optimization
optimize_battery_schedule(historical_data, electricity_rate)

- Peak shaving recommendations
- Time-of-use charging/discharging strategy
- Annual cost savings potential
- Estimated battery replacement timing

---

## ⚙️ Configuration

### Default Settings

Edit `CONFIG` object in `js/main.js`:

const CONFIG = { CO2_PER_KWH: 0.4,              // kg CO₂ per kWh (grid mix dependent) BATTERY_EFFICIENCY: 0.95,      // Round-trip efficiency (charging + discharging) INVERTER_EFFICIENCY: 0.98,     // DC-to-AC conversion loss PHP_TO_USD: 0.018,             // Exchange rate (update as needed) ELECTRICITY_RATE_PHP: 11.50,   // Local electricity rate (₱/kWh) FEED_IN_RATE_PHP: 5.75         // Grid export compensation (₱/kWh) };


### Dynamic Settings

**In ROI Calculator UI:**
- System Cost: Total installation cost
- Electricity Rate: Your local utility rate
- Feed-in Rate: Grid export rate (if applicable)
- Annual Degradation: Panel & battery degradation

**In Weather Indicator (above charts):**
- Provider Selection: Choose weather API
- Manual Retry: Force re-fetch forecast

---

## 🌦️ Weather Providers

The app supports 10+ weather providers with automatic fallback:

| Provider | Free Tier | API Key | Speed | Accuracy |
|----------|-----------|---------|-------|----------|
| **Open-Meteo** ⭐ | ✅ Unlimited | ❌ None | Fast | Good |
| WeatherAPI.com | ✅ Free | ⚠️ Required | Very Fast | Excellent |
| OpenWeatherMap | ✅ Free | ⚠️ Required | Fast | Good |
| WeatherBit | ✅ Free | ⚠️ Required | Fast | Good |
| wttr.in | ✅ Unlimited | ❌ None | Medium | Fair |
| Tomorrow.io | ❌ Paid | ⚠️ Required | Very Fast | Excellent |
| ClimaCell | ❌ Paid | ⚠️ Required | Very Fast | Excellent |
| Weather.gov | ✅ Free (USA) | ❌ None | Medium | Good |
| Visual Crossing | ✅ Free | ⚠️ Required | Medium | Good |
| Mock Data | ✅ Always | ❌ None | Instant | Simulated |

**Recommendation:** Use **Open-Meteo** (default) - no API key, unlimited free tier, excellent privacy.

---

## 🎨 Customization

### Themes & Colors

Edit `css/styles.css` to customize:
- Primary colors (currently amber #F59E0B)
- Dark background (#0F1419)
- Accent colors (green, purple, blue)
- Font families
- Chart colors
- Metric card gradients

### Unit System

Click ⚙️ in header to toggle:
- **Power:** Watts (W) ↔ Kilowatts (kW)
- **Daily Energy:** Wh ↔ kWh ↔ MWh
- **Emissions:** kg ↔ metric tons ↔ grams

### Language/Localization

Metrics labels are currently in English. To add translations:
1. Create language files in `locales/` folder
2. Load based on browser language
3. Update text in `js/main.js` and `index.html`

---

## 🔒 Privacy & Security

✅ **100% Client-Side Processing**
- No server, no backend, no cloud
- All calculations happen in your browser
- CSV data never leaves your device

✅ **No Tracking**
- No analytics libraries
- No cookies or sessions
- No user profiling

✅ **Open Source**
- Full transparency
- Community-reviewed code
- MIT License

⚠️ **External Requests**
- Weather API calls (IP visible to provider)
- CDN library loads (Chart.js, PyScript, etc.)
- First-time PyScript runtime download

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Charts not showing** | Clear browser cache; refresh page; check console for CDN errors |
| **CSV upload fails** | Verify column headers match Sungrow format; try smaller file first |
| **Python functions not available** | Wait 30+ seconds for PyScript load; check Network tab for blocked requests |
| **Weather data fails** | Click 🔄 Retry; select different provider; check internet connection |
| **Export creates blank image** | Try exporting individual charts; use PNG instead of HTML |
| **ROI shows ∞ payback** | Check system cost > 0; ensure data loaded; verify electricity rate set |
| **Loading indicator stuck** | Check browser console for errors; reload page; try smaller CSV |
| **PyScript CDN blocked** | Check corporate/school firewall; use VPN if needed; offline mode unavailable |

---

## 📊 Example Workflow

### Scenario: Monthly System Review

1. **Export Data**
   - Sungrow App → Reports → Last 30 days → Download CSV

2. **Upload to Dashboard**
   - Drag CSV onto Solar Analytics
   - Wait for processing complete

3. **Review Metrics**
   - Check Energy Efficiency and Grid Independence
   - Note any unusual battery cycling patterns

4. **Financial Analysis**
   - Adjust electricity rate if tariff changed
   - Check ROI Payback Period
   - Review 25-year projections

5. **Export Report**
   - Click 📄 HTML to create shareable report
   - OR 📥 Dashboard for high-res chart images
   - OR 📊 CSV for Excel analysis

6. **Share Results**
   - Send HTML report to family/stakeholders
   - Use PNG for social media posts
   - Import CSV to Python for advanced analysis

---

## 🚀 Performance Tips

**Optimize for Speed:**
- Use Daily reports (not weekly) for detailed analysis
- Keep CSV files <50MB (typically <10 years of 5-min data)
- Close unnecessary browser tabs
- Use Chrome/Chromium for best WebAssembly performance

**First-Time Setup:**
- PyScript runtime loads once (~30MB) and caches
- Subsequent visits are much faster
- Budget 30-60 seconds on first load
- Disable VPN temporarily if download stalls

**Data Processing:**
- Daily CSV (2880 rows): ~200ms processing
- Weekly CSV (52 rows): ~50ms processing
- Python calculations: ~500-1000ms (one-time per upload)

---

## 📈 Roadmap

**In Development:**
- [ ] Machine learning-based PV forecasting (ARIMA/Prophet)
- [ ] Real-time anomaly detection for system faults
- [ ] Advanced battery cycle optimization
- [ ] Multi-site dashboard aggregation

**Planned Features:**
- [ ] Cloud sync & historical database
- [ ] Third-party API integrations
- [ ] Email report scheduling
- [ ] Advanced ML models for load forecasting

**Contributing:**
- Fork the repository
- Create feature branch
- Submit pull request
- Follow existing code style

---

## 📄 License

**MIT License** - Free to use, modify, and distribute

See LICENSE file for full legal terms.

---

## ⚠️ Disclaimer

*Financial calculations and system health metrics are based on:*
- *General engineering baselines (0.4kg CO₂/kWh, standard efficiencies)*
- *Your provided electricity rates and system cost*
- *Historical data patterns (not guaranteed to continue)*

**Use for informational purposes only.** Not liable for:
- Investment decisions based on projections
- System reliability claims
- Weather forecast accuracy
- Local regulation compliance

---

## 💬 Support

**Issues & Bugs:**
- GitHub Issues: Report problems with detailed reproduction steps
- Include browser version, CSV sample (anonymized), and console errors

**Feature Requests:**
- GitHub Discussions: Suggest improvements
- Vote on community requests

**Questions:**
- Check Troubleshooting section first
- Review example data format in Data Requirements
- Test with mock weather data before reporting issues

---

## 🙏 Credits & Attribution

**Libraries & Services:**
- [PapaParse](https://www.papaparse.com/) - CSV parsing
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [html2canvas](https://html2canvas.hertzen.com/) - Dashboard export
- [JSZip](https://stuk.github.io/jszip/) - File compression
- [PyScript](https://pyscript.net/) - Python in browser
- [Pyodide](https://pyodide.org/) - CPython WebAssembly
- [Open-Meteo](https://open-meteo.com/) - Weather API

**Inspired By:**
- Sungrow iSolarCloud monitoring platform
- Home energy management systems
- Data-driven sustainability tools

---

*Last Updated: June 22, 2026*
*Version: 1.0.0*
