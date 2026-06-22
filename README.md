>[!WARNING]
> I am not, in any way, affiliated to SUNGROW. All tools are created and provided by me with no means of actively profiting and advertising this project, especially outside voluntary donations.

## ⚡ Solar Analytics: PV + BESS Intelligence Platform

Solar Analytics is a lightweight, fully client-side web application designed to parse, analyze, and visualize daily and weekly solar generation and Battery Energy Storage System (BESS) data exported from **Sungrow** inverters.
>[!NOTE]
> Limited to SUNGROW monitoring app in the meantime.


Simply drag and drop your exported CSV reports to instantly unlock real-time energy flow tracking, financial ROI metrics, interactive timelines, and professional reporting tools.

---

## 🚀 Key Features

* **Zero-Server CSV Parsing:** Fast, secure, and private client-side processing using `PapaParse`. Your energy data never leaves your browser.
* **Dynamic System Overview:** A real-time energy flow snapshot showing current generation, battery State of Charge (SOC), consumption load, and grid net metrics.
* **Granular Performance Metrics:** * *Basic:* PV Generation, Battery SOC, System Load, and Grid Import/Export with data shift indicators.
* *Advanced:* System Energy Efficiency, Grid Independence %, Daily Financial Savings, and Carbon ($CO_2$) Offset metrics.


* **Interactive Analytics Panels:** Four independent responsive timelines built with `Chart.js` tracking PV Generation, Battery SOC lifecycle, Stacked Energy Flow, and System Load Demand.
* **Predictive ROI Calculator:** Projections modeling system cost, local utility rates, feed-in tariffs, and equipment hardware degradation over a 25-year cycle.
* **Multi-Format Export Engine:** High-fidelity dashboard exports to `.png` (via `html2canvas`), standalone distribution `.html` reports, or normalized compiled `.csv` spreadsheets.

---

## 🛠️ Tech Stack

* **Structure:** HTML5 (Semantic Layout)
* **Data Parsing:** [PapaParse v5.4.1](https://www.papaparse.com/)
* **Data Visualization:** [Chart.js v3.9.1](https://www.chartjs.org/)
* **Export Mechanics:** [html2canvas v1.4.1](https://html2canvas.hertzen.com/) & [JSZip v3.10.1](https://stuk.github.io/jszip/)

---

## 📂 Project Architecture

To run this dashboard properly, ensure your local directory environment includes both your markup and styling files:

```bash
├── index.html       # The core file containing UI structure and logic
└── style.css        # External stylesheet handling layout, dark-mode colors, and responsive metrics grids

```

> 💡 **Note:** Since the application calls external CDN dependencies for parsing and charting libraries, an active internet connection is required to load charts and parse files successfully on startup.

---

## 📥 Data Requirements

The data parser looks for structural attributes standard in **Sungrow** monitoring exports. Supported profiles include:

### 1. Daily Reports

Expects time-series polling intervals mapping real-time power steps. Key tracking indicators include:

* `Time`, `PV(W)`, `Battery SOC(%)`, `Load(W)`, `Grid(W)`, and `Battery(W)`.

### 2. Weekly Reports

Automatically falls back to tracking cumulative yield performance metrics per day:

* `Time`, `PV(kWh)`, `Battery charge(kWh)`, `Battery discharge(kWh)`, `Energy purchase(kWh)`, `Feed-in(kWh)`, and `Load(kWh)`.

---

## ⏱️ Quick Start

1. Clone or save `index.html` and your accompanying `style.css` file into the same directory folder.
2. Open `index.html` directly in any modern desktop web browser (Chrome, Safari, Edge, Firefox).
3. Drag and drop your Sungrow-exported CSV report directly onto the dropzone canvas, or click **Choose CSV File**.
4. Adjust the financial inputs inside the **ROI Calculator** block and click calculate to view targeted ecosystem metrics over long-term lifecycles.

---

## 📄 License

This project is open-source and free to use for personal validation, home automation hacking, or integration extensions.

***Disclaimer:*** *Financial calculations and system health assertions inside this app are based on general engineering baselines (0.4kg CO_2 per kWh ideal invert efficiencies) and should be used strictly for informational estimates.*
