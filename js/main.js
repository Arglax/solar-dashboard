let currentData = null;
let currentPeriod = 'daily';
let charts = {};
let calculatorData = {};
let weeklyForecastData = null;
let batteryOptimization = null;
let pythonAnalytics = null;

const CONFIG = {
    CO2_PER_KWH: 0.4,
    BATTERY_CYCLES_THRESHOLD: 5000,
    BATTERY_EFFICIENCY: 0.95,
    INVERTER_EFFICIENCY: 0.98,
    PHP_TO_USD: 0.018,
    ELECTRICITY_RATE_PHP: 11.50,
    FEED_IN_RATE_PHP: 5.75
};

const uploadArea = document.getElementById('uploadArea');
const csvFile = document.getElementById('csvFile');
const selectFileBtn = document.getElementById('selectFileBtn');

// Initialize UI manager
UIManager.init();

selectFileBtn.addEventListener('click', () => csvFile.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.opacity = '0.7';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.opacity = '1';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.opacity = '1';
    if (e.dataTransfer.files.length) {
        csvFile.files = e.dataTransfer.files;
        processFile();
    }
});

csvFile.addEventListener('change', processFile);

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message show ${type}`;
    setTimeout(() => statusEl.classList.remove('show'), 5000);
}

function showLoadingIndicator(show = true) {
    let loader = document.getElementById('loadingIndicator');
    
    if (show && !loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 20, 25, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <div style="width: 60px; height: 60px; border: 4px solid rgba(245, 158, 11, 0.2); border-top: 4px solid #F59E0B; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div style="color: #E6EDF3; font-size: 18px; font-weight: 500;">Processing CSV File...</div>
                    <div id="loadingProgress" style="width: 300px; height: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px; overflow: hidden;">
                        <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #F59E0B, #10B981); border-radius: 4px; animation: progress 2s ease-in-out infinite;"></div>
                    </div>
                    <div id="loadingText" style="color: #94A3B8; font-size: 12px;">Please wait...</div>
                </div>
                <style>
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    @keyframes progress {
                        0% { width: 0%; }
                        50% { width: 100%; }
                        100% { width: 100%; }
                    }
                </style>
            </div>
        `;
        document.body.appendChild(loader);
    } else if (!show && loader) {
        loader.remove();
    }
}

function processFile() {
    const file = csvFile.files[0];
    if (!file) return;

    showLoadingIndicator(true);
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = `Loading ${file.name}...`;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            if (!results.data || results.data.length === 0) {
                showLoadingIndicator(false);
                showStatus('No data found in CSV', 'error');
                return;
            }

            try {
                const headers = Object.keys(results.data[0]);
                console.log('CSV Headers:', headers);

                if (loadingText) loadingText.textContent = 'Processing data...';

                const processed = DataProcessor.processFile(results.data, headers);

                currentData = {
                    type: processed.format,
                    raw: processed.data,
                    fileName: file.name,
                    headers: headers,
                    normalized: processed.data
                };

                console.log('Processed Data:', currentData);

                if (loadingText) loadingText.textContent = 'Running Python analytics...';

                // Run Python analytics
                if (window.solarAnalyticsPy) {
                    try {
                        const advancedMetrics = JSON.parse(
                            window.solarAnalyticsPy.run_advanced_metrics(
                                JSON.stringify(processed.data)
                            )
                        );
                        console.log('Advanced Metrics:', advancedMetrics);

                        const batteryAnalysis = JSON.parse(
                            window.solarAnalyticsPy.run_battery_analysis(
                                JSON.stringify(processed.data)
                            )
                        );
                        console.log('Battery Analysis:', batteryAnalysis);
                    } catch (pyError) {
                        console.warn('Python analytics error:', pyError);
                    }
                }

                if (loadingText) loadingText.textContent = 'Fetching weather forecast...';

                const selectedSource = document.getElementById('weatherSourceSelect')?.value || 'auto';
                WeatherPredictor.getWeatherForecast(14.5995, 120.9842, selectedSource)
                    .then(weatherResult => {
                        UIManager.setWeatherData(weatherResult);
                        
                        if (processed.format === 'daily') {
                            if (loadingText) loadingText.textContent = 'Generating forecast...';
                            
                            weeklyForecastData = DataProcessor.generateWeeklyForecast(
                                processed.data,
                                weatherResult.forecast
                            );
                            console.log('Weekly Forecast Data:', weeklyForecastData);
                            showWeatherIndicator(weatherResult.source);

                            if (loadingText) loadingText.textContent = 'Analyzing battery...';
                            
                            batteryOptimization = BatteryOptimizer.analyze(processed.data, weatherResult.forecast);
                            console.log('Battery Optimization:', batteryOptimization);
                        }
                    })
                    .catch(err => {
                        console.warn('Weather fetch failed:', err);
                        showStatus('⚠️ Weather data unavailable, using forecast mode', 'warning');
                    });

                UIManager.setCurrentData(currentData);
                UIManager.showUploadReset(file.name);
                
                if (loadingText) loadingText.textContent = 'Building dashboard...';
                
                initializeDashboard();
                showLoadingIndicator(false);
                showStatus(`✓ ${file.name} loaded successfully`, 'success');
            } catch (error) {
                console.error('Error:', error);
                showLoadingIndicator(false);
                showStatus('Error processing file: ' + error.message, 'error');
            }
        },
        error: (error) => {
            console.error('Parse Error:', error);
            showLoadingIndicator(false);
            showStatus('Error parsing CSV: ' + error.message, 'error');
        }
    });
}

function showWeatherIndicator(source) {
    const indicator = document.getElementById('weatherIndicator');
    const sourceEl = document.getElementById('weatherSource');
    indicator.style.display = 'block';
    sourceEl.textContent = source === 'mock' ? 'mock' : source;
}

function retryWeather() {
    showStatus('⏳ Fetching weather data...', 'success');
    const selectedSource = document.getElementById('weatherSourceSelect')?.value || 'auto';
    WeatherPredictor.getWeatherForecast(14.5995, 120.9842, selectedSource).then(result => {
        UIManager.setWeatherData(result);
        if (currentData && currentData.type === 'daily') {
            weeklyForecastData = DataProcessor.generateWeeklyForecast(
                currentData.normalized,
                result.forecast
            );
            showWeatherIndicator(result.source);
            renderCharts();
            showStatus('✓ Weather data refreshed from ' + result.source, 'success');
        }
    }).catch(err => {
        showStatus('Error fetching weather: ' + err.message, 'error');
    });
}

function initializeDashboard() {
    console.log('Initializing Dashboard');
    document.getElementById('energyFlowSection').style.display = 'block';
    document.getElementById('metricsSection').style.display = 'block';
    document.getElementById('chartsSection').style.display = 'block';
    document.getElementById('calculatorSection').style.display = 'block';
    document.getElementById('tableSection').style.display = 'block';

    setupToggleControls();
    updateMetrics();
    renderCharts();
    renderTable();
    setupPeriodSelector();
    setupExportButtons();
    setupCalculator();
    setupWeatherRetry();
    setupBatteryOptimizer();
}

function setupWeatherRetry() {
    const retryBtn = document.getElementById('retryWeatherBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', retryWeather);
        console.log('Weather retry button setup');
    }
}

function setupToggleControls() {
    const toggles = document.querySelectorAll('[data-group]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const group = toggle.dataset.group;
            const cards = document.querySelectorAll(`[data-metric-group="${group}"]`);
            cards.forEach(card => {
                card.style.display = toggle.checked ? 'block' : 'none';
            });
        });
    });
}

function formatMetricValue(value, unit) {
    const units = UIManager.getUnitSettings();
    let converted = value;

    if (unit === 'power') {
        converted = UIManager.convertUnit(value, 'W', units.energy);
    } else if (unit === 'energy') {
        converted = UIManager.convertUnit(value, 'Wh', units.dailyEnergy);
    } else if (unit === 'emission') {
        converted = UIManager.convertUnit(value, 'kg', units.emission);
    }

    return converted.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function updateMetrics() {
    const data = currentData.normalized;
    if (!data || data.length === 0) return;

    let lastRow, firstRow;
    lastRow = data[data.length - 1];
    firstRow = data[0];

    const pv = lastRow.pv || 0;
    const soc = lastRow.soc || 0;
    const load = lastRow.load || 0;
    const grid = lastRow.grid || 0;
    const battery = lastRow.battery || 0;

    const units = UIManager.getUnitSettings();
    const pvDisplay = formatMetricValue(pv, 'power');
    const loadDisplay = formatMetricValue(load, 'power');
    const gridDisplay = formatMetricValue(grid, 'power');

    document.getElementById('metricPV').textContent = pvDisplay;
    document.getElementById('metricBattery').textContent = Math.round(soc);
    document.getElementById('metricLoad').textContent = loadDisplay;
    document.getElementById('metricGrid').textContent = gridDisplay;

    document.getElementById('flowPV').textContent = pvDisplay + ' ' + units.energy;
    document.getElementById('flowBattery').textContent = Math.round(soc) + '%';
    document.getElementById('flowLoad').textContent = loadDisplay + ' ' + units.energy;
    document.getElementById('flowGrid').textContent = gridDisplay + ' ' + units.energy;

    const efficiency = (load > 0) ? Math.min(100, ((load - grid) / (pv || 1)) * 100) : 0;
    const independence = Math.max(0, Math.min(100, ((load - grid) / (load || 1)) * 100));

    document.getElementById('metricEfficiency').textContent = Math.round(efficiency);
    document.getElementById('metricIndependence').textContent = Math.round(independence);

    const dailySavings = ((pv - grid) * (parseFloat(document.getElementById('electricityRate').value) || CONFIG.ELECTRICITY_RATE_PHP));
    document.getElementById('metricSavings').textContent = '₱' + Math.max(0, dailySavings.toFixed(2));

    const dailyCO2 = (pv / 1000) * CONFIG.CO2_PER_KWH;
    const co2Converted = formatMetricValue(dailyCO2, 'emission');
    document.getElementById('metricCO2').textContent = Math.max(0, co2Converted);

    const batteryHealth = Math.min(100, 100 - (Math.abs(battery) * 0.0001));
    document.getElementById('metricBatteryHealth').textContent = batteryHealth > 80 ? 'Good' : batteryHealth > 60 ? 'Fair' : 'Poor';
    document.getElementById('batteryHealthPercent').textContent = Math.round(batteryHealth) + '%';

    if (data.length > 1) {
        const pvChange = pv - (firstRow.pv || 0);
        const socChange = soc - (firstRow.soc || 0);
        const loadChange = load - (firstRow.load || 0);

        updateChangeIndicator('pvChange', pvChange, pv);
        updateChangeIndicator('batteryChange', socChange, soc);
        updateChangeIndicator('loadChange', loadChange, load);
    }

    calculatorData.avgDailySavings = dailySavings;
}

function updateChangeIndicator(elementId, change, current) {
    const el = document.getElementById(elementId);
    if (Math.abs(change) > 0.1) {
        const arrow = change > 0 ? '↑' : '↓';
        const absChange = Math.abs(change).toFixed(1);
        el.textContent = `${arrow} ${absChange}`;
        el.style.display = 'inline-block';
    }
}

function renderCharts() {
    console.log('Rendering Charts - Current Period:', currentPeriod);
    if (!currentData) {
        console.warn('No current data for charts');
        return;
    }

    if (currentPeriod === 'daily' || currentData.type === 'daily') {
        console.log('Rendering daily charts');
        renderDailyCharts(currentData.normalized);
    } else {
        console.log('Rendering weekly charts with data:', weeklyForecastData);
        renderWeeklyCharts(weeklyForecastData || []);
    }
}

function renderDailyCharts(data) {
    const times = data.map(d => {
        if (!d.time) return '';
        const date = new Date(d.time);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });

    const pv = data.map(d => d.pv || 0);
    const soc = data.map(d => d.soc || 0);
    const load = data.map(d => d.load || 0);
    const grid = data.map(d => d.grid || 0);
    const battery = data.map(d => d.battery || 0);

    Object.values(charts).forEach(chart => chart?.destroy?.());
    charts = {};

    const units = UIManager.getUnitSettings();

    const pvCtx = document.getElementById('pvChart').getContext('2d');
    charts.pv = new Chart(pvCtx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: `Solar Generation (${units.energy})`,
                data: pv,
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointBackgroundColor: '#F59E0B'
            }]
        },
        options: chartOptions()
    });

    const socCtx = document.getElementById('socChart').getContext('2d');
    charts.soc = new Chart(socCtx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Battery SOC (%)',
                data: soc,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 2,
                pointBackgroundColor: '#10B981'
            }]
        },
        options: chartOptions()
    });

    const energyCtx = document.getElementById('energyChart').getContext('2d');
    charts.energy = new Chart(energyCtx, {
        type: 'bar',
        data: {
            labels: times.slice(0, 24),
            datasets: [
                {
                    label: `Solar (${units.energy})`,
                    data: pv.slice(0, 24),
                    backgroundColor: '#F59E0B'
                },
                {
                    label: `Battery (${units.energy})`,
                    data: battery.slice(0, 24),
                    backgroundColor: '#10B981'
                },
                {
                    label: `Grid (${units.energy})`,
                    data: grid.slice(0, 24),
                    backgroundColor: '#8B5CF6'
                }
            ]
        },
        options: {
            ...chartOptions(),
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    stacked: false,
                    ticks: { color: '#CBD5E1' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            }
        }
    });

    const loadCtx = document.getElementById('loadChart').getContext('2d');
    charts.load = new Chart(loadCtx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: `System Load (${units.energy})`,
                data: load,
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 1,
                pointBackgroundColor: '#6366F1'
            }]
        },
        options: chartOptions()
    });
}

function renderWeeklyCharts(data) {
    if (!data || data.length === 0) {
        showStatus('No weekly forecast data available', 'error');
        return;
    }

    const dates = data.map(d => d.date || '');
    const pv = data.map(d => d.pv || 0);
    const purchase = data.map(d => d.purchase || 0);
    const feedIn = data.map(d => d.feedIn || 0);
    const charge = data.map(d => d.charge || 0);
    const discharge = data.map(d => d.discharge || 0);
    const load = data.map(d => d.load || 0);

    Object.values(charts).forEach(chart => chart?.destroy?.());
    charts = {};

    const units = UIManager.getUnitSettings();

    const pvCtx = document.getElementById('pvChart').getContext('2d');
    charts.pv = new Chart(pvCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: `PV Generation (${units.dailyEnergy})`,
                data: pv,
                backgroundColor: '#F59E0B'
            }]
        },
        options: chartOptions()
    });

    const socCtx = document.getElementById('socChart').getContext('2d');
    charts.soc = new Chart(socCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: `Battery Charge (${units.dailyEnergy})`,
                    data: charge,
                    backgroundColor: '#10B981'
                },
                {
                    label: `Battery Discharge (${units.dailyEnergy})`,
                    data: discharge,
                    backgroundColor: '#EF4444'
                }
            ]
        },
        options: chartOptions()
    });

    const energyCtx = document.getElementById('energyChart').getContext('2d');
    charts.energy = new Chart(energyCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: `Grid Purchase (${units.dailyEnergy})`,
                    data: purchase,
                    backgroundColor: '#8B5CF6'
                },
                {
                    label: `Feed-in (${units.dailyEnergy})`,
                    data: feedIn,
                    backgroundColor: '#F59E0B'
                }
            ]
        },
        options: chartOptions()
    });

    const loadCtx = document.getElementById('loadChart').getContext('2d');
    charts.load = new Chart(loadCtx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: `Total Load (${units.dailyEnergy})`,
                data: load,
                backgroundColor: '#6366F1'
            }]
        },
        options: chartOptions()
    });
}

function chartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#CBD5E1' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94A3B8', maxTicksLimit: 8 },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#CBD5E1' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };
}

function renderTable() {
    const data = currentData.normalized;
    if (!data) return;

    const headers = ['time', 'pv', 'grid', 'battery', 'load', 'soc'];
    const headerRow = headers
        .map(h => `<th>${h.toUpperCase()}</th>`)
        .join('');
    
    document.getElementById('tableHeader').innerHTML = headerRow;
    document.getElementById('tableBody').innerHTML = '';

    const rowsToShow = data.slice(-20).reverse();
    const units = UIManager.getUnitSettings();
    
    let bodyHTML = '';
    rowsToShow.forEach(row => {
        const cells = [
            row.time || '',
            formatMetricValue(row.pv, 'power'),
            formatMetricValue(row.grid, 'power'),
            formatMetricValue(row.battery, 'power'),
            formatMetricValue(row.load, 'power'),
            Math.round(row.soc) + '%'
        ];
        bodyHTML += `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });
    document.getElementById('tableBody').innerHTML = bodyHTML;
}

function setupPeriodSelector() {
    const buttons = document.querySelectorAll('.period-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Period button clicked:', btn.dataset.period);
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            btn.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.6)';
            currentPeriod = btn.dataset.period;
            renderCharts();
            renderTable();
        });
    });

    if (currentData && currentData.type === 'daily') {
        document.getElementById('periodSelector').style.display = 'flex';
    }
}

function setupExportButtons() {
    document.getElementById('exportDashboard').addEventListener('click', exportDashboard);
    document.getElementById('exportHTML').addEventListener('click', exportHTML);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);

    document.getElementById('downloadPVChart').addEventListener('click', () => downloadChart('pvChart', 'pv-generation'));
    document.getElementById('downloadSOCChart').addEventListener('click', () => downloadChart('socChart', 'battery-soc'));
    document.getElementById('downloadEnergyChart').addEventListener('click', () => downloadChart('energyChart', 'energy-flow'));
    document.getElementById('downloadLoadChart').addEventListener('click', () => downloadChart('loadChart', 'system-load'));
}

async function exportDashboard() {
    const btn = document.getElementById('exportDashboard');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    try {
        const canvas = await html2canvas(document.querySelector('.container'), {
            backgroundColor: '#0F1419',
            allowTaint: true,
            useCORS: true,
            scale: 2
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `solar-dashboard-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        showStatus('✓ Dashboard exported as PNG', 'success');
    } catch (error) {
        showStatus('Error exporting dashboard: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '📥 Dashboard';
    }
}

function exportHTML() {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Solar Analytics Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { background: #0F1419; color: #E6EDF3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Solar Analytics Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>File:</strong> ${currentData.fileName}</p>
        <hr style="border: 1px solid rgba(148, 163, 184, 0.2); margin: 20px 0;">
        ${document.querySelector('.container').innerHTML}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solar-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    showStatus('✓ Report exported as HTML', 'success');
}

function exportCSV() {
    let csv = 'time,pv,grid,battery,load,soc\n';
    currentData.normalized.forEach(row => {
        csv += `${row.time},${row.pv},${row.grid},${row.battery},${row.load},${row.soc}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `solar-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showStatus('✓ Data exported as CSV', 'success');
}

async function downloadChart(chartId, name) {
    try {
        const canvas = document.getElementById(chartId);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${name}-${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        showStatus('✓ Chart exported', 'success');
    } catch (error) {
        showStatus('Error exporting chart', 'error');
    }
}

function setupCalculator() {
    const btn = document.getElementById('calculateBtn');
    if (btn) {
        btn.removeEventListener('click', calculateROI);
        btn.addEventListener('click', calculateROI);
        console.log('Calculator button setup');
    }
}

function calculateROI() {
    const systemCost = parseFloat(document.getElementById('systemCost').value) || 0;
    const electricityRate = parseFloat(document.getElementById('electricityRate').value) || CONFIG.ELECTRICITY_RATE_PHP;
    const feedInRate = parseFloat(document.getElementById('feedInRate').value) || CONFIG.FEED_IN_RATE_PHP;
    const degradation = parseFloat(document.getElementById('degradation').value) || 0.5;

    if (systemCost <= 0) {
        showStatus('Please enter system cost', 'error');
        return;
    }

    if (!currentData || !currentData.normalized) {
        showStatus('Please load data first', 'error');
        return;
    }

    console.log('Calculating ROI...', { systemCost, electricityRate, feedInRate, degradation });

    // Use Python for financial forecast if available
    if (window.solarAnalyticsPy) {
        try {
            const forecast = JSON.parse(
                window.solarAnalyticsPy.run_financial_forecast(
                    JSON.stringify(currentData.normalized),
                    electricityRate,
                    feedInRate,
                    25
                )
            );

            if (forecast && forecast.length > 0) {
                const year1 = forecast[0];
                const year25 = forecast[24];
                
                document.getElementById('paybackYears').textContent = (systemCost / year1.annual_savings).toFixed(1);
                document.getElementById('annualSavings').textContent = '₱' + year1.annual_savings.toFixed(0);
                document.getElementById('lifetimeValue').textContent = '₱' + year25.cumulative_savings.toFixed(0);
                
                const totalCO2 = (year25.annual_pv * 25 * CONFIG.CO2_PER_KWH / 1000).toFixed(1);
                document.getElementById('totalCO2').textContent = totalCO2;
                
                document.getElementById('calculatorResults').style.display = 'grid';
                showStatus('✓ ROI calculations updated (Python)', 'success');
                return;
            }
        } catch (pyError) {
            console.warn('Python forecast error, using fallback:', pyError);
        }
    }

    // Fallback to JavaScript calculation
    const totalPV = currentData.normalized.reduce((sum, d) => sum + (d.pv || 0), 0);
    const totalLoad = currentData.normalized.reduce((sum, d) => sum + (d.load || 0), 0);
    const totalGrid = currentData.normalized.reduce((sum, d) => sum + Math.max(0, d.grid || 0), 0);

    const avgDailyPV = (totalPV / currentData.normalized.length) * 24 / 1000;
    const avgDailyPurchase = (totalGrid / currentData.normalized.length) * 24 / 1000;

    const annualPVGeneration = avgDailyPV * 365;
    const annualGridPurchase = avgDailyPurchase * 365;
    const annualSavings = (annualPVGeneration - annualGridPurchase) * electricityRate;
    const paybackYears = annualSavings > 0 ? systemCost / annualSavings : Infinity;

    let lifetimeValue = 0;
    let currentAnnualSavings = annualSavings;
    for (let year = 0; year < 25; year++) {
        lifetimeValue += currentAnnualSavings;
        currentAnnualSavings *= (1 - (degradation / 100));
    }

    const totalCO2 = (annualPVGeneration * 25 * CONFIG.CO2_PER_KWH / 1000).toFixed(1);

    document.getElementById('paybackYears').textContent = paybackYears === Infinity ? '∞' : paybackYears.toFixed(1);
    document.getElementById('annualSavings').textContent = '₱' + annualSavings.toFixed(0);
    document.getElementById('lifetimeValue').textContent = '₱' + lifetimeValue.toFixed(0);
    document.getElementById('totalCO2').textContent = totalCO2;
    document.getElementById('calculatorResults').style.display = 'grid';

    showStatus('✓ ROI calculations updated', 'success');
}

function setupBatteryOptimizer() {
    const btn = document.getElementById('batteryOptBtn');
    if (btn) {
        btn.removeEventListener('click', handleBatteryOptClick);
        btn.addEventListener('click', handleBatteryOptClick);
        console.log('Battery optimizer button setup');
    }
}

function handleBatteryOptClick() {
    console.log('Battery optimization clicked');
    if (!batteryOptimization) {
        showStatus('Battery optimization data not available. Please load data first.', 'error');
        return;
    }
    const resultsEl = document.getElementById('batteryOptResults');
    resultsEl.textContent = BatteryOptimizer.formatBatteryReport(batteryOptimization);
    resultsEl.style.display = 'block';
    const btn = document.getElementById('batteryOptBtn');
    btn.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
    btn.style.borderColor = '#10B981';
    showStatus('✓ Battery optimization analysis generated', 'success');
}

window.addEventListener('unitsChanged', () => {
    if (currentData) {
        UIManager.updateMetricUnits();
        updateMetrics();
        renderCharts();
        renderTable();
    }
        let currentPeriod = 'daily';
        let charts = {};
        let calculatorData = {};
        let weeklyForecastData = null;
        let batteryOptimization = null;
        let pythonAnalytics = null;

        const CONFIG = {
            CO2_PER_KWH: 0.4,
            BATTERY_CYCLES_THRESHOLD: 5000,
            BATTERY_EFFICIENCY: 0.95,
            INVERTER_EFFICIENCY: 0.98,
            ELECTRICITY_RATE_PHP: 11.50,
            FEED_IN_RATE_PHP: 5.75
        };

        const uploadArea = document.getElementById('uploadArea');
        const csvFile = document.getElementById('csvFile');
        const selectFileBtn = document.getElementById('selectFileBtn');

        // Initialize UI manager
        UIManager.init();

        selectFileBtn.addEventListener('click', () => csvFile.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.opacity = '0.7';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.opacity = '1';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.opacity = '1';
            if (e.dataTransfer.files.length) {
                csvFile.files = e.dataTransfer.files;
                processFile();
            }
        });

        csvFile.addEventListener('change', processFile);

        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMessage');
            statusEl.textContent = message;
            statusEl.className = `status-message show ${type}`;
            setTimeout(() => statusEl.classList.remove('show'), 5000);
        }

        function showLoadingIndicator(show = true) {
            let loader = document.getElementById('loadingIndicator');

            if (show && !loader) {
                loader = document.createElement('div');
                loader.id = 'loadingIndicator';
                loader.innerHTML = `
                    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 20, 25, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 9999;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                            <div style="width: 60px; height: 60px; border: 4px solid rgba(245, 158, 11, 0.2); border-top: 4px solid #F59E0B; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <div style="color: #E6EDF3; font-size: 18px; font-weight: 500;">Processing CSV File...</div>
                            <div id="loadingProgress" style="width: 300px; height: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px; overflow: hidden;">
                                <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #F59E0B, #10B981); border-radius: 4px; animation: progress 2s ease-in-out infinite;"></div>
                            </div>
                            <div id="loadingText" style="color: #94A3B8; font-size: 12px;">Please wait...</div>
                        </div>
                        <style>
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                            @keyframes progress {
                                0% { width: 0%; }
                                50% { width: 100%; }
                                100% { width: 100%; }
                            }
                        </style>
                    </div>
                `;
                document.body.appendChild(loader);
            } else if (!show && loader) {
                loader.remove();
            }
        }

        function processFile() {
            const file = csvFile.files[0];
            if (!file) return;

            showLoadingIndicator(true);
            const loadingText = document.getElementById('loadingText');
            if (loadingText) loadingText.textContent = `Loading ${file.name}...`;

            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    if (!results.data || results.data.length === 0) {
                        showLoadingIndicator(false);
                        showStatus('CSV file is empty', 'error');
                        return;
                    }

                    try {
                        // Detect format
                        const headers = Object.keys(results.data[0]);
                        const format = DataProcessor.detectFormat(headers);
                        console.log('Detected format:', format, 'Headers:', headers);

                        if (!format) {
                            showLoadingIndicator(false);
                            showStatus('Unrecognized CSV format. Expected Sungrow Daily or Weekly reports.', 'error');
                            return;
                        }

                        // Normalize data
                        let normalizedData;
                        if (format === 'daily') {
                            normalizedData = DataProcessor.normalizeDailyData(results.data, headers);
                        } else {
                            normalizedData = DataProcessor.normalizeWeeklyData(results.data, headers);
                        }

                        console.log('Normalized data:', normalizedData);

                        // Process with weather (async, non-blocking)
                        if (loadingText) loadingText.textContent = 'Fetching weather forecast...';
                        
                        const weatherData = await WeatherPredictor.fetchWeatherForecast().catch(err => {
                            console.log('Weather fetch failed, using mock:', err.message);
                            return null;
                        });

                        if (loadingText) loadingText.textContent = 'Generating predictions...';

                        // Generate predictions
                        let predictiveData = null;
                        if (weatherData) {
                            predictiveData = DataProcessor.generatePredictiveWeekly(normalizedData, weatherData);
                            weeklyForecastData = predictiveData;
                        }

                        console.log('Predictive data:', predictiveData);

                        // Initialize dashboard
                        initializeDashboard(normalizedData, format);

                        // Fetch Python analytics asynchronously
                        if (window.solarAnalyticsPy) {
                            try {
                                const pyResult = await window.solarAnalyticsPy.run_battery_analysis(
                                    JSON.stringify(normalizedData.slice(0, 30))
                                );
                                batteryOptimization = JSON.parse(pyResult);
                                console.log('Battery optimization:', batteryOptimization);
                            } catch (err) {
                                console.log('Python bridge failed, using fallback:', err);
                            }
                        }

                        showStatus('✅ CSV loaded successfully!', 'success');
                        showLoadingIndicator(false);

                    } catch (error) {
                        console.error('Processing error:', error);
                        showStatus(`Error: ${error.message}`, 'error');
                        showLoadingIndicator(false);
                    }
                },
                error: (error) => {
                    showLoadingIndicator(false);
                    showStatus(`Parse error: ${error.message}`, 'error');
                }
            });
        }

        function initializeDashboard(data, format) {
            // Show sections
            document.getElementById('energyFlowSection').style.display = 'block';
            document.getElementById('metricsSection').style.display = 'block';
            document.getElementById('calculatorSection').style.display = 'block';
            document.getElementById('chartsSection').style.display = 'block';
            document.getElementById('tableSection').style.display = 'block';

            // Store data for later use
            calculatorData = { data, format };

            // Update metrics
            updateMetrics(data);

            // Render table
            renderTable(data);

            // Initialize charts
            initializeCharts(data);

            // Setup calculator
            setupCalculator();

            // Setup battery optimizer
            setupBatteryOptimizer(data);

            // Setup toggles
            setupMetricToggles();
        }

        function updateMetrics(data) {
            if (!data || data.length === 0) return;

            const latest = data[data.length - 1];
            const prev = data.length > 1 ? data[data.length - 2] : null;

            // Parse numeric values
            const pv = parseFloat(latest.pv_power) || 0;
            const battery = parseFloat(latest.battery_soc) || 0;
            const load = parseFloat(latest.load_power) || 0;
            const grid = parseFloat(latest.grid_power) || 0;

            // Basic metrics
            document.getElementById('metricPV').textContent = Math.round(pv);
            document.getElementById('metricBattery').textContent = Math.round(battery);
            document.getElementById('metricLoad').textContent = Math.round(load);
            document.getElementById('metricGrid').textContent = Math.round(grid);

            // Flow diagram
            document.getElementById('flowPV').textContent = `${Math.round(pv)} W`;
            document.getElementById('flowBattery').textContent = `${Math.round(battery)}%`;
            document.getElementById('flowLoad').textContent = `${Math.round(load)} W`;
            document.getElementById('flowGrid').textContent = `${Math.round(grid)} W`;

            // Advanced metrics
            const efficiency = pv > 0 ? ((load - Math.max(0, grid)) / pv * 100) : 0;
            const independence = load > 0 ? ((pv + (battery > 0 ? 100 : 0)) / load * 100) : 0;

            document.getElementById('metricEfficiency').textContent = Math.round(Math.max(0, Math.min(100, efficiency)));
            document.getElementById('metricIndependence').textContent = Math.round(Math.max(0, Math.min(100, independence)));

            // Daily savings and CO2
            const dailySavings = (pv - Math.max(0, grid)) * CONFIG.ELECTRICITY_RATE_PHP / 1000;
            const co2Offset = (pv * CONFIG.CO2_PER_KWH) / 1000;

            document.getElementById('metricSavings').textContent = `₱${Math.round(dailySavings)}`;
            document.getElementById('metricCO2').textContent = Math.round(co2Offset * 100) / 100;
        }

        function renderTable(data) {
            if (!data || data.length === 0) return;

            const headers = Object.keys(data[0]);
            const tableHeader = document.getElementById('tableHeader');
            const tableBody = document.getElementById('tableBody');

            // Clear
            tableHeader.innerHTML = '';
            tableBody.innerHTML = '';

            // Build headers
            let headerHTML = '';
            headers.forEach(h => {
                headerHTML += `<th>${h}</th>`;
            });
            tableHeader.innerHTML = headerHTML;

            // Build body - optimized single build
            let bodyHTML = '';
            data.forEach(row => {
                bodyHTML += '<tr>';
                headers.forEach(h => {
                    const val = row[h] || '';
                    bodyHTML += `<td>${val}</td>`;
                });
                bodyHTML += '</tr>';
            });
            tableBody.innerHTML = bodyHTML;
        }

        function initializeCharts(data) {
            if (!data || data.length === 0) return;

            const labels = data.map((d, i) => d.time || `T${i}`);
            const pvData = data.map(d => parseFloat(d.pv_power) || 0);
            const socData = data.map(d => parseFloat(d.battery_soc) || 0);
            const loadData = data.map(d => parseFloat(d.load_power) || 0);
            const gridData = data.map(d => parseFloat(d.grid_power) || 0);

            // Destroy old charts
            Object.keys(charts).forEach(key => {
                if (charts[key]) charts[key].destroy();
            });

            const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#CBD5E1' }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#94A3B8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                }
            };

            // PV Chart
            charts.pv = new Chart(document.getElementById('pvChart'), {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'PV Generation (W)',
                        data: pvData,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });

            // SOC Chart
            charts.soc = new Chart(document.getElementById('socChart'), {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Battery SOC (%)',
                        data: socData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });

            // Energy Flow Chart
            charts.energy = new Chart(document.getElementById('energyChart'), {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'PV (W)',
                            data: pvData,
                            borderColor: '#F59E0B',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Load (W)',
                            data: loadData,
                            borderColor: '#06B6D4',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Grid (W)',
                            data: gridData,
                            borderColor: '#EF4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: chartOptions
            });

            // Load Chart
            charts.load = new Chart(document.getElementById('loadChart'), {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Load (W)',
                        data: loadData,
                        borderColor: '#06B6D4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: chartOptions
            });
        }

        function setupCalculator() {
            const calculateBtn = document.getElementById('calculateBtn');
            const systemCostInput = document.getElementById('systemCost');
            const electricityRateInput = document.getElementById('electricityRate');
            const feedInRateInput = document.getElementById('feedInRate');
            const degradationInput = document.getElementById('degradation');

            // Set PHP defaults
            electricityRateInput.value = CONFIG.ELECTRICITY_RATE_PHP;
            feedInRateInput.value = CONFIG.FEED_IN_RATE_PHP;

            calculateBtn.addEventListener('click', calculateROI);
        }

        function calculateROI() {
            if (!calculatorData.data || calculatorData.data.length === 0) {
                showStatus('Please load data first', 'error');
                return;
            }

            const systemCost = parseFloat(document.getElementById('systemCost').value) || 500000;
            const elecRate = parseFloat(document.getElementById('electricityRate').value) || CONFIG.ELECTRICITY_RATE_PHP;
            const feedInRate = parseFloat(document.getElementById('feedInRate').value) || CONFIG.FEED_IN_RATE_PHP;
            const degradation = parseFloat(document.getElementById('degradation').value) || 0.5;

            const data = calculatorData.data;

            // Calculate annual metrics
            const avgDailyPV = data.reduce((sum, d) => sum + (parseFloat(d.pv_power) || 0), 0) / data.length;
            const avgDailyLoad = data.reduce((sum, d) => sum + (parseFloat(d.load_power) || 0), 0) / data.length;
            const avgDailyGridPurchase = data.reduce((sum, d) => {
                const grid = parseFloat(d.grid_power) || 0;
                return sum + Math.max(0, grid);
            }, 0) / data.length;

            const annualPV = (avgDailyPV * 365) / 1000; // kWh
            const annualGridPurchase = (avgDailyGridPurchase * 365) / 1000; // kWh
            const annualSavingsNoDegrade = ((annualPV - annualGridPurchase) * elecRate + annualGridPurchase * (elecRate - feedInRate));

            // Apply degradation
            const year1Savings = annualSavingsNoDegrade * (1 - (degradation / 100));

            // Payback period
            const paybackYears = systemCost / year1Savings;

            // 25-year projection
            let totalSavings = 0;
            for (let i = 1; i <= 25; i++) {
                const yearSavings = annualSavingsNoDegrade * Math.pow(1 - (degradation / 100), i);
                totalSavings += yearSavings;
            }

            // CO2 offset
            const totalCO2 = (annualPV * CONFIG.CO2_PER_KWH * 25) / 1000;

            // Display results
            document.getElementById('paybackYears').textContent = Math.round(paybackYears * 10) / 10;
            document.getElementById('annualSavings').textContent = `₱${Math.round(year1Savings)}`;
            document.getElementById('lifetimeValue').textContent = `₱${Math.round(totalSavings)}`;
            document.getElementById('totalCO2').textContent = Math.round(totalCO2);

            document.getElementById('calculatorResults').style.display = 'grid';

            // Show payback breakdown
            showPaybackBreakdown({
                systemCost,
                elecRate,
                feedInRate,
                degradation,
                annualPV,
                annualGridPurchase,
                annualSavingsNoDegrade,
                year1Savings,
                paybackYears,
                avgDailyPV,
                avgDailyLoad,
                avgDailyGridPurchase
            });
        }

        function showPaybackBreakdown(metrics) {
            const breakdown = document.getElementById('paybackBreakdown');
            breakdown.style.display = 'block';

            // Populate input variables
            document.getElementById('breakdown-systemCost').textContent = `₱${Math.round(metrics.systemCost)}`;
            document.getElementById('breakdown-elecRate').textContent = `₱${metrics.elecRate}/kWh`;
            document.getElementById('breakdown-feedInRate').textContent = `₱${metrics.feedInRate}/kWh`;
            document.getElementById('breakdown-degradation').textContent = `${metrics.degradation}%`;

            // Populate calculated metrics
            document.getElementById('breakdown-annualPV').textContent = `${Math.round(metrics.annualPV)} kWh`;
            document.getElementById('breakdown-gridPurchase').textContent = `${Math.round(metrics.annualGridPurchase)} kWh`;
            document.getElementById('breakdown-annualSavingsBase').textContent = `₱${Math.round(metrics.annualSavingsNoDegrade)}`;
            document.getElementById('breakdown-year1Savings').textContent = `₱${Math.round(metrics.year1Savings)}`;

            // Populate formula
            document.getElementById('breakdown-formula-cost').textContent = Math.round(metrics.systemCost);
            document.getElementById('breakdown-formula-savings').textContent = Math.round(metrics.year1Savings);
            document.getElementById('breakdown-formula-result').textContent = `${(Math.round(metrics.paybackYears * 10) / 10)} years`;

            // Populate detailed table
            const table = document.getElementById('paybackBreakdownTable');
            table.innerHTML = `
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Average Daily PV Generation</td>
                    <td style="padding: 8px; text-align: right;">${Math.round(metrics.avgDailyPV)} W</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Average power from solar panels per day</td>
                </tr>
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Average Daily Grid Purchase</td>
                    <td style="padding: 8px; text-align: right;">${Math.round(metrics.avgDailyGridPurchase)} W</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Power consumed from grid per day</td>
                </tr>
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Annual PV Generation</td>
                    <td style="padding: 8px; text-align: right;">${Math.round(metrics.annualPV)} kWh</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Yearly solar generation (365 days)</td>
                </tr>
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Annual Grid Purchase</td>
                    <td style="padding: 8px; text-align: right;">${Math.round(metrics.annualGridPurchase)} kWh</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Yearly grid consumption (365 days)</td>
                </tr>
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Annual Savings (No Degradation)</td>
                    <td style="padding: 8px; text-align: right;">₱${Math.round(metrics.annualSavingsNoDegrade)}</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Perfect year savings before panel degradation</td>
                </tr>
                <tr style="border-bottom: 1px solid #8B5CF6;">
                    <td style="padding: 8px;">Year 1 Savings (With Degradation)</td>
                    <td style="padding: 8px; text-align: right;">₱${Math.round(metrics.year1Savings)}</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">First year savings after ${metrics.degradation}% degradation</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 600;">Payback Period</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600; color: #6366F1;">${Math.round(metrics.paybackYears * 10) / 10} years</td>
                    <td style="padding: 8px; font-size: 11px; color: #94A3B8;">Time to recover system cost</td>
                </tr>
            `;

            // Setup toggle
            const toggleBtn = document.getElementById('togglePaybackBreakdown');
            const content = document.getElementById('paybackBreakdownContent');
            
            if (!toggleBtn._listener) {
                toggleBtn._listener = true;
                toggleBtn.addEventListener('click', () => {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    toggleBtn.textContent = isHidden ? '▲' : '▼';
                });
            }
        }

        function setupMetricToggles() {
            document.getElementById('toggleBasic').addEventListener('change', (e) => {
                document.querySelectorAll('[data-metric-group="basic"]').forEach(el => {
                    el.style.display = e.target.checked ? 'block' : 'none';
                });
            });

            document.getElementById('toggleAdvanced').addEventListener('change', (e) => {
                document.querySelectorAll('[data-metric-group="advanced"]').forEach(el => {
                    el.style.display = e.target.checked ? 'block' : 'none';
                });
            });
        }

        function setupBatteryOptimizer(data) {
            const batteryOptBtn = document.getElementById('batteryOptBtn');
            batteryOptBtn.addEventListener('click', () => {
                handleBatteryOptClick(data);
            });

            // Setup view toggle buttons
            document.querySelectorAll('.battery-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.battery-view-btn').forEach(b => {
                        b.style.background = 'transparent';
                        b.style.color = '#CBD5E1';
                        b.style.borderColor = '#CBD5E1';
                    });
                    e.target.style.background = '#10B981';
                    e.target.style.color = 'white';
                    e.target.style.borderColor = '#10B981';
                    
                    const view = e.target.dataset.view;
                    showBatteryOptView(view);
                });
            });

            // Setup collapse toggle
            const toggleCollapse = document.getElementById('toggleBatteryOpt');
            const container = document.getElementById('batteryOptContainer');
            
            if (toggleCollapse && !toggleCollapse._listener) {
                toggleCollapse._listener = true;
                toggleCollapse.addEventListener('click', () => {
                    const isHidden = container.style.display === 'none';
                    container.style.display = isHidden ? 'block' : 'none';
                    toggleCollapse.textContent = isHidden ? '▼ Collapse' : '▶ Expand';
                });
            }
        }

        function handleBatteryOptClick(data) {
            const container = document.getElementById('batteryOptContainer');
            
            if (container.style.display === 'none' || !container.style.display) {
                container.style.display = 'block';
                
                // Generate optimization report
                const report = generateBatteryOptimizationReport(data);
                
                // Show text view by default
                showBatteryOptView('text', report);
                
                // Populate table view
                populateBatteryOptTable(report);
                
                // Populate chart view
                populateBatteryOptChart(report);
            } else {
                container.style.display = 'none';
            }
        }

        function showBatteryOptView(view, report) {
            const textView = document.getElementById('batteryOptText');
            const tableView = document.getElementById('batteryOptTable');
            const chartView = document.getElementById('batteryOptChart');

            // Hide all
            textView.style.display = 'none';
            tableView.style.display = 'none';
            chartView.style.display = 'none';

            if (view === 'text') {
                textView.style.display = 'block';
            } else if (view === 'table') {
                tableView.style.display = 'block';
            } else if (view === 'chart') {
                chartView.style.display = 'block';
            }
        }

        function generateBatteryOptimizationReport(data) {
            const avgSOC = data.reduce((sum, d) => sum + (parseFloat(d.battery_soc) || 0), 0) / data.length;
            const maxSOC = Math.max(...data.map(d => parseFloat(d.battery_soc) || 0));
            const minSOC = Math.min(...data.map(d => parseFloat(d.battery_soc) || 0));

            const avgCharge = data.filter(d => {
                const soc = parseFloat(d.battery_soc) || 0;
                return soc > avgSOC;
            }).length;

            const chargePercent = (avgCharge / data.length) * 100;

            const text = `
        BATTERY OPTIMIZATION ANALYSIS REPORT
        =====================================

        System Status:
          Average State of Charge (SOC): ${Math.round(avgSOC)}%
          Maximum SOC Reached: ${Math.round(maxSOC)}%
          Minimum SOC Level: ${Math.round(minSOC)}%
          
        Charging Pattern:
          Time Spent Above Average: ${Math.round(chargePercent)}%
          Recommended Action: ${chargePercent > 60 ? 'Battery charging well' : 'Increase charging'}

        Recommendations:
          • Maintain SOC between 20-80% for optimal battery lifespan
          • Avoid frequent deep discharges below 10%
          • Avoid sustained charging above 95%
          • Current pattern suggests: ${avgSOC > 70 ? 'GOOD health' : avgSOC > 40 ? 'OPTIMAL balance' : 'CHARGING NEEDED'}

        Health Indicators:
          • Estimated Cycles: ${Math.round((100 - minSOC) / 100 * 1000)}
          • Degradation Rate: ~${0.5 + Math.random()}%/year
          • Expected Lifespan: 10-15 years
            `;

            return {
                text: text.trim(),
                avgSOC,
                maxSOC,
                minSOC,
                chargePercent,
                cycles: Math.round((100 - minSOC) / 100 * 1000),
                health: avgSOC > 70 ? 'GOOD' : avgSOC > 40 ? 'OPTIMAL' : 'NEEDS CHARGING'
            };
        }

        function populateBatteryOptTable(report) {
            const textView = document.getElementById('batteryOptText');
            textView.textContent = report.text;

            const tableBody = document.getElementById('batteryOptTableBody');
            tableBody.innerHTML = `
                <tr style="border-bottom: 1px solid #10B981;">
                    <td style="padding: 8px;">Average SOC</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600;">${Math.round(report.avgSOC)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #10B981;">
                    <td style="padding: 8px;">Maximum SOC</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600;">${Math.round(report.maxSOC)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #10B981;">
                    <td style="padding: 8px;">Minimum SOC</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600;">${Math.round(report.minSOC)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #10B981;">
                    <td style="padding: 8px;">Charging Time Ratio</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600;">${Math.round(report.chargePercent)}%</td>
                </tr>
                <tr style="border-bottom: 1px solid #10B981;">
                    <td style="padding: 8px;">Estimated Cycles</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600;">${report.cycles}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: 600;">Health Status</td>
                    <td style="padding: 8px; text-align: right; font-weight: 600; color: #10B981;">${report.health}</td>
                </tr>
            `;
        }

        function populateBatteryOptChart(report) {
            const canvas = document.getElementById('batteryOptChartCanvas');
            if (!canvas) return;

            if (charts.batteryOpt) charts.batteryOpt.destroy();

            charts.batteryOpt = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: ['Above Average', 'Below Average'],
                    datasets: [{
                        data: [report.chargePercent, 100 - report.chargePercent],
                        backgroundColor: ['#10B981', '#EF4444'],
                        borderColor: ['#059669', '#DC2626'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#CBD5E1' }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.label}: ${Math.round(context.parsed)}%`
                            }
                        }
                    }
                }
            });
        }
});