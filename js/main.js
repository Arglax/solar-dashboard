// ============================================================
// Solar Analytics Dashboard - Main Orchestration Logic
// Master Arglax - v0.2.0
// ============================================================

class SolarDashboard {
    constructor() {
        this.data = null;
        this.processedData = null;
        this.weatherData = null;
        this.charts = {};
        this.init();
    }

    // ── Initialization ──
    init() {
        this.setupEventListeners();
        this.initializeTooltips();
        this.loadUnitsFromStorage();
    }

    setupEventListeners() {
        // File upload
        const csvFile = document.getElementById('csvFile');
        const uploadArea = document.getElementById('uploadArea');
        const selectBtn = document.getElementById('selectFileBtn');
        
        if (selectBtn) selectBtn.addEventListener('click', () => csvFile.click());
        if (csvFile) csvFile.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--accent-solar)';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) {
                    csvFile.files = e.dataTransfer.files;
                    this.handleFileUpload({ target: { files: e.dataTransfer.files } });
                }
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetData());

        // Calculator
        const calcBtn = document.getElementById('calculateBtn');
        if (calcBtn) calcBtn.addEventListener('click', () => this.calculateROI());

        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.switchPeriod(e.target.dataset.period);
            });
        });

        // Battery optimizer
        const battOptBtn = document.getElementById('batteryOptBtn');
        if (battOptBtn) battOptBtn.addEventListener('click', () => this.runBatteryOptimizer());

        // Battery view toggle
        document.querySelectorAll('.battery-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.battery-view-btn').forEach(b => b.style.background = 'transparent');
                document.querySelectorAll('.battery-view-btn').forEach(b => b.style.color = '#CBD5E1');
                e.target.style.background = '#10B981';
                e.target.style.color = '#000';
                
                const view = e.target.dataset.view;
                document.getElementById('batteryOptText').style.display = view === 'text' ? 'block' : 'none';
                document.getElementById('batteryOptTable').style.display = view === 'table' ? 'block' : 'none';
                document.getElementById('batteryOptChart').style.display = view === 'chart' ? 'block' : 'none';
            });
        });

        // Toggle collapse
        const toggleCollapse = document.getElementById('toggleBatteryOpt');
        if (toggleCollapse) {
            toggleCollapse.addEventListener('click', () => {
                const container = document.getElementById('batteryOptContainer');
                const isHidden = container.style.display === 'none';
                container.style.display = isHidden ? 'block' : 'none';
                toggleCollapse.textContent = isHidden ? '▼ Collapse' : '▶ Expand';
            });
        }

        // Export buttons
        const exportBtn = document.getElementById('exportDashboard');
        const exportCSVBtn = document.getElementById('exportCSV');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportDashboard());
        if (exportCSVBtn) exportCSVBtn.addEventListener('click', () => this.exportCSV());

        // Chart downloads
        document.querySelectorAll('[id$="Chart"]').forEach(btn => {
            if (btn.id.includes('download')) {
                btn.addEventListener('click', (e) => {
                    const chartName = e.target.id.replace('download', '').replace('Chart', '');
                    this.downloadChart(chartName.toLowerCase());
                });
            }
        });

        // Metric toggles
        document.getElementById('toggleBasic').addEventListener('change', (e) => {
            const visible = e.target.checked;
            document.querySelectorAll('[data-metric-group="basic"]').forEach(el => {
                el.style.display = visible ? 'block' : 'none';
            });
        });

        document.getElementById('toggleAdvanced').addEventListener('change', (e) => {
            const visible = e.target.checked;
            document.querySelectorAll('[data-metric-group="advanced"]').forEach(el => {
                el.style.display = visible ? 'block' : 'none';
            });
        });
    }

    // ── File Upload & Processing ──
    async handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                this.showStatus('Parsing CSV file...', 'info');
                
                const csv = event.target.result;
                const lines = csv.trim().split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                
                const data = Papa.parse(csv, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true
                }).data.filter(row => Object.values(row).some(v => v !== ''));

                if (!data || data.length === 0) {
                    throw new Error('No data found in CSV file');
                }

                // Process data
                const processed = DataProcessor.processFile(data, headers);
                this.data = data;
                this.processedData = processed;

                // Show reset container
                const uploadArea = document.getElementById('uploadArea');
                const resetContainer = document.getElementById('uploadResetContainer');
                if (uploadArea) uploadArea.style.display = 'none';
                if (resetContainer) {
                    resetContainer.style.display = 'block';
                    document.getElementById('loadedFileName').textContent = `📁 ${file.name}`;
                }

                // Fetch weather data
                await this.fetchWeatherData();

                // Update UI
                this.updateAllMetrics();
                this.renderCharts();
                this.showAllSections();

                this.showStatus(`✓ Loaded ${data.length} records from ${file.name}`, 'success');
            } catch (error) {
                console.error('Upload error:', error);
                this.showStatus(`Error: ${error.message}`, 'error');
            }
        };

        reader.onerror = () => {
            this.showStatus('Error reading file', 'error');
        };

        reader.readAsText(file);
    }

    resetData() {
        this.data = null;
        this.processedData = null;
        this.weatherData = null;
        
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('uploadResetContainer').style.display = 'none';
        document.getElementById('csvFile').value = '';
        
        ['energyFlowSection', 'metricsSection', 'chartsSection', 'calculatorSection', 'tableSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart instanceof Chart) chart.destroy();
        });
        this.charts = {};

        this.showStatus('Data cleared', 'info');
    }

    // ── Weather Integration ──
    async fetchWeatherData() {
        try {
            this.showStatus('Fetching weather forecast...', 'info');
            
            // Quezon City coordinates (default)
            const lat = 14.5995;
            const lon = 120.9842;
            
            const result = await WeatherPredictor.getWeatherForecast(lat, lon, 'auto');
            this.weatherData = result.forecast;
            
            console.log(`Weather source: ${result.source}, ${this.weatherData.length} days forecast`);
        } catch (error) {
            console.warn('Weather fetch failed, using mock data:', error);
            this.weatherData = WeatherPredictor.getMockForecast().forecast;
        }
    }

    // ── Metrics & Updates ──
    updateAllMetrics() {
        if (!this.processedData || !this.processedData.data.length) return;

        const data = this.processedData.data;
        const format = this.processedData.format;

        if (format === 'daily') {
            this.updateDailyMetrics(data);
        } else {
            this.updateWeeklyMetrics(data);
        }
    }

    updateDailyMetrics(data) {
        const latest = data[data.length - 1];
        const avg = {
            pv: data.reduce((sum, d) => sum + (d.pv || 0), 0) / data.length,
            load: data.reduce((sum, d) => sum + (d.load || 0), 0) / data.length,
            soc: data.reduce((sum, d) => sum + (d.soc || 0), 0) / data.length,
            grid: data.reduce((sum, d) => sum + (d.grid || 0), 0) / data.length
        };

        // Update flow nodes
        document.getElementById('flowPV').textContent = `${Math.round(latest.pv)} W`;
        document.getElementById('flowBattery').textContent = `${Math.round(latest.soc)}%`;
        document.getElementById('flowLoad').textContent = `${Math.round(latest.load)} W`;
        document.getElementById('flowGrid').textContent = `${Math.round(latest.grid)} W`;

        // Update metric cards
        document.getElementById('metricPV').textContent = Math.round(avg.pv);
        document.getElementById('metricBattery').textContent = Math.round(avg.soc);
        document.getElementById('metricLoad').textContent = Math.round(avg.load);
        document.getElementById('metricGrid').textContent = Math.round(avg.grid);

        // Advanced metrics
        const totalPV = data.reduce((sum, d) => sum + (d.pv || 0), 0);
        const totalLoad = data.reduce((sum, d) => sum + (d.load || 0), 0);
        const totalGridImport = data.reduce((sum, d) => Math.max(0, d.grid || 0), 0);
        
        const efficiency = totalLoad > 0 ? Math.min(100, (totalLoad / totalPV) * 100) : 0;
        const independence = totalLoad > 0 ? Math.max(0, ((totalLoad - totalGridImport) / totalLoad) * 100) : 0;
        const dailySavings = (totalPV / 12000) * 11.50; // Estimate: ₱11.50/kWh
        const dailyCO2 = (totalPV / 12000) * 0.4; // 0.4 kg CO2 per kWh

        document.getElementById('metricEfficiency').textContent = Math.round(efficiency);
        document.getElementById('metricIndependence').textContent = Math.round(independence);
        document.getElementById('metricSavings').textContent = `₱${Math.round(dailySavings)}`;
        document.getElementById('metricCO2').textContent = Math.round(dailyCO2 * 100) / 100;

        // Update data table
        this.populateTable(data);
    }

    updateWeeklyMetrics(data) {
        const latest = data[data.length - 1];
        
        // For weekly data, convert to reasonable power figures
        const avgPV = latest.pv * 1000 / 24; // Convert kWh to average W
        const avgLoad = latest.load * 1000 / 24;
        const avgGrid = (latest.purchase - latest.feedIn) * 1000 / 24;

        document.getElementById('flowPV').textContent = `${Math.round(avgPV)} W`;
        document.getElementById('flowBattery').textContent = `75%`;
        document.getElementById('flowLoad').textContent = `${Math.round(avgLoad)} W`;
        document.getElementById('flowGrid').textContent = `${Math.round(avgGrid)} W`;

        document.getElementById('metricPV').textContent = Math.round(avgPV);
        document.getElementById('metricLoad').textContent = Math.round(avgLoad);
        document.getElementById('metricGrid').textContent = Math.round(avgGrid);

        const efficiency = data.reduce((sum, d) => sum + d.pv, 0) > 0 
            ? Math.round((data.reduce((sum, d) => sum + d.load, 0) / data.reduce((sum, d) => sum + d.pv, 0)) * 100)
            : 0;
        
        document.getElementById('metricEfficiency').textContent = Math.min(100, efficiency);
        document.getElementById('metricIndependence').textContent = '82';
        document.getElementById('metricSavings').textContent = `₱${Math.round(data.reduce((sum, d) => sum + d.pv, 0) * 11.50)}`;
        document.getElementById('metricCO2').textContent = (data.reduce((sum, d) => sum + d.pv, 0) * 0.4).toFixed(2);

        this.populateTable(data);
    }

    populateTable(data) {
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');

        if (!tableHeader || !tableBody) return;

        // Clear existing
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            tableHeader.appendChild(th);
        });

        data.slice(-50).forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(h => {
                const td = document.createElement('td');
                const val = row[h];
                td.textContent = typeof val === 'number' ? val.toFixed(2) : val;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        document.getElementById('tableSection').style.display = 'block';
    }

    // ── Charting ──
    renderCharts() {
        if (!this.processedData || !this.processedData.data.length) return;

        const data = this.processedData.data;
        const format = this.processedData.format;

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart instanceof Chart) chart.destroy();
        });

        if (format === 'daily') {
            this.renderDailyCharts(data);
        } else {
            this.renderWeeklyCharts(data);
        }
    }

    renderDailyCharts(data) {
        const times = data.map(d => d.time || '');
        const pvData = data.map(d => d.pv || 0);
        const loadData = data.map(d => d.load || 0);
        const socData = data.map(d => d.soc || 0);
        const gridData = data.map(d => d.grid || 0);

        const chartConfig = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#CBD5E1', font: { size: 11 } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        beginAtZero: true
                    },
                    x: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        };

        // PV Chart
        this.charts.pv = new Chart(document.getElementById('pvChart'), {
            ...chartConfig,
            data: {
                labels: times,
                datasets: [{
                    label: 'PV Generation (W)',
                    data: pvData,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            }
        });

        // SOC Chart
        this.charts.soc = new Chart(document.getElementById('socChart'), {
            ...chartConfig,
            data: {
                labels: times,
                datasets: [{
                    label: 'Battery SOC (%)',
                    data: socData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            }
        });

        // Energy Flow Chart
        this.charts.energy = new Chart(document.getElementById('energyChart'), {
            type: 'bar',
            data: {
                labels: times,
                datasets: [
                    {
                        label: 'PV (W)',
                        data: pvData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)'
                    },
                    {
                        label: 'Load (W)',
                        data: loadData,
                        backgroundColor: 'rgba(99, 102, 241, 0.7)'
                    }
                ]
            },
            options: {
                ...chartConfig.options,
                scales: {
                    ...chartConfig.options.scales,
                    x: { ...chartConfig.options.scales.x, stacked: false }
                }
            }
        });

        // Load Chart
        this.charts.load = new Chart(document.getElementById('loadChart'), {
            ...chartConfig,
            data: {
                labels: times,
                datasets: [{
                    label: 'System Load (W)',
                    data: loadData,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            }
        });
    }

    renderWeeklyCharts(data) {
        const dates = data.map(d => d.date || '');
        const pvData = data.map(d => d.pv || 0);
        const loadData = data.map(d => d.load || 0);
        const chargeData = data.map(d => d.charge || 0);
        const dischargeData = data.map(d => d.discharge || 0);

        const chartConfig = {
            type: 'line',
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#CBD5E1', font: { size: 11 } }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        beginAtZero: true
                    },
                    x: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            }
        };

        // PV Chart
        this.charts.pv = new Chart(document.getElementById('pvChart'), {
            ...chartConfig,
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily PV Generation (kWh)',
                    data: pvData,
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            }
        });

        // Battery Charge/Discharge
        this.charts.battery = new Chart(document.getElementById('socChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Charge (kWh)',
                        data: chargeData,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)'
                    },
                    {
                        label: 'Discharge (kWh)',
                        data: dischargeData,
                        backgroundColor: 'rgba(239, 68, 68, 0.7)'
                    }
                ]
            },
            options: chartConfig.options
        });

        // Energy Flow
        this.charts.energy = new Chart(document.getElementById('energyChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'PV (kWh)',
                        data: pvData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)'
                    },
                    {
                        label: 'Load (kWh)',
                        data: loadData,
                        backgroundColor: 'rgba(99, 102, 241, 0.7)'
                    }
                ]
            },
            options: chartConfig.options
        });

        // Load
        this.charts.load = new Chart(document.getElementById('loadChart'), {
            ...chartConfig,
            data: {
                labels: dates,
                datasets: [{
                    label: 'Load (kWh)',
                    data: loadData,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    fill: true
                }]
            }
        });
    }

    // ── Battery Optimization ──
    runBatteryOptimizer() {
        if (!this.processedData || !this.processedData.data.length) {
            this.showStatus('No data available', 'error');
            return;
        }

        const data = this.processedData.data;
        const stats = BatteryOptimizer.analyze(data, this.weatherData || []);
        const report = BatteryOptimizer.formatBatteryReport(stats);

        document.getElementById('batteryOptContainer').style.display = 'block';
        document.getElementById('batteryOptText').textContent = report;
        document.getElementById('batteryOptText').style.display = 'block';

        // Generate table
        const tableHTML = `
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #CBD5E1;">
                <thead style="background: rgba(16, 185, 129, 0.1); border-bottom: 1px solid #10B981;">
                    <tr>
                        <th style="padding: 8px; text-align: left; border-right: 1px solid #10B981;">Metric</th>
                        <th style="padding: 8px; text-align: right;">Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                        <td style="padding: 8px;">Grid Feed-in Potential</td>
                        <td style="padding: 8px; text-align: right;">${stats.gridFeedInPotential.toFixed(2)} kWh</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                        <td style="padding: 8px;">Grid Feed-in Revenue</td>
                        <td style="padding: 8px; text-align: right;">₱${stats.gridFeedInRevenue.toFixed(2)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                        <td style="padding: 8px;">Weekly Generation</td>
                        <td style="padding: 8px; text-align: right;">${stats.weeklyProjection.avgGeneration.toFixed(2)} kWh</td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
                        <td style="padding: 8px;">Weekly Savings</td>
                        <td style="padding: 8px; text-align: right;">₱${stats.weeklyProjection.projectedSavings.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;">Monthly Savings</td>
                        <td style="padding: 8px; text-align: right;">₱${stats.monthlyProjection.projectedSavings.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        `;
        document.getElementById('batteryOptTable').innerHTML = tableHTML;
    }

    // ── ROI Calculator ──
    calculateROI() {
        if (!this.processedData || !this.processedData.data.length) {
            this.showStatus('No data available', 'error');
            return;
        }

        const systemCost = parseFloat(document.getElementById('systemCost').value) || 500000;
        const elecRate = parseFloat(document.getElementById('electricityRate').value) || 11.50;
        const feedInRate = parseFloat(document.getElementById('feedInRate').value) || 5.75;
        const degradation = parseFloat(document.getElementById('degradation').value) || 0.5;

        const data = this.processedData.data;
        const dailyPV = data.reduce((sum, d) => sum + (d.pv || 0), 0) / 1000 / 12; // Convert to kWh daily
        const annualPV = dailyPV * 365;

        // Calculate annual savings
        let annualSavings = 0;
        for (let year = 0; year < 25; year++) {
            const degradationFactor = Math.pow(1 - (degradation / 100), year);
            const yearPV = annualPV * degradationFactor;
            const yearSavings = (yearPV * 0.7 * elecRate) + (yearPV * 0.3 * feedInRate);
            if (year === 0) annualSavings = yearSavings;
        }

        const paybackYears = systemCost / annualSavings;
        const lifetimeValue = annualSavings * 25;
        const co2Offset = annualPV * 0.4 * 25 / 1000; // Tons

        // Update results
        document.getElementById('paybackYears').textContent = paybackYears.toFixed(1);
        document.getElementById('annualSavings').textContent = `₱${Math.round(annualSavings).toLocaleString()}`;
        document.getElementById('lifetimeValue').textContent = `₱${Math.round(lifetimeValue).toLocaleString()}`;
        document.getElementById('totalCO2').textContent = Math.round(co2Offset * 100) / 100;

        document.getElementById('calculatorResults').style.display = 'grid';
        this.showStatus(`ROI calculated: ${paybackYears.toFixed(1)} year payback period`, 'success');
    }

    // ── Exports ──
    async exportDashboard() {
        this.showStatus('Exporting dashboard...', 'info');
        try {
            const container = document.querySelector('.container');
            const canvas = await html2canvas(container, {
                backgroundColor: '#0F1419',
                scale: 1.5
            });
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `solar-dashboard-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
            this.showStatus('Dashboard exported successfully', 'success');
        } catch (error) {
            this.showStatus(`Export failed: ${error.message}`, 'error');
        }
    }

    exportCSV() {
        if (!this.processedData || !this.processedData.data.length) {
            this.showStatus('No data to export', 'error');
            return;
        }

        const csv = Papa.unparse(this.processedData.data);
        const link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        link.download = `solar-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showStatus('Data exported as CSV', 'success');
    }

    downloadChart(chartName) {
        const canvas = document.getElementById(`${chartName}Chart`);
        if (!canvas || !this.charts[chartName]) {
            this.showStatus('Chart not available', 'error');
            return;
        }

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${chartName}-chart.png`;
        link.click();
    }

    // ── UI Helpers ──
    switchPeriod(period) {
        console.log('Switched to period:', period);
        // Charts already rendered, just update labels if needed
    }

    showAllSections() {
        const sections = [
            'energyFlowSection',
            'metricsSection',
            'chartsSection',
            'calculatorSection'
        ];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'block';
        });
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `status-message show ${type}`;

        if (type !== 'error') {
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, 4000);
        }
    }

    // ── Tooltips ──
    initializeTooltips() {
        document.addEventListener('mouseenter', (e) => {
            if (e.target.dataset.tooltip) {
                this.showTooltip(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (e.target.dataset.tooltip) {
                this.hideTooltip();
            }
        }, true);
    }

    showTooltip(target) {
        let tooltip = document.getElementById('dashboardTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'dashboardTooltip';
            tooltip.className = 'tooltip-popup';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = target.dataset.tooltip;
        tooltip.classList.add('visible');
        this.positionTooltip(target, tooltip);
    }

    hideTooltip() {
        const tooltip = document.getElementById('dashboardTooltip');
        if (tooltip) tooltip.classList.remove('visible');
    }

    positionTooltip(target, tooltip) {
        const rect = target.getBoundingClientRect();
        let top = rect.top - 50;
        let left = rect.left + rect.width / 2 - 140;

        if (top < 0) top = rect.bottom + 10;
        if (left < 10) left = 10;
        if (left + 280 > window.innerWidth) left = window.innerWidth - 290;

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    // ── Storage ──
    loadUnitsFromStorage() {
        const stored = localStorage.getItem('solarDashboard_units');
        if (stored) {
            try {
                JSON.parse(stored);
            } catch (e) {
                // Invalid stored data
            }
        }
    }
}

// Initialize dashboard on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SolarDashboard();
});
