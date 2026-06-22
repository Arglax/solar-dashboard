const UIManager = (() => {
    let currentData = null;
    let weatherData = null;

    function createUploadReset() {
        const uploadSection = document.querySelector('.upload-section');
        const resetHTML = `
      <div class="upload-reset-container" style="display: none; padding: 12px 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border-left: 3px solid #10B981;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <span id="loadedFileName" style="font-size: 14px; color: #E6EDF3;">File loaded</span>
          <button id="resetDataBtn" class="btn btn-secondary btn-sm" style="margin: 0;">🔄 Clear Data</button>
        </div>
      </div>
    `;
        uploadSection.insertAdjacentHTML('afterbegin', resetHTML);

        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetData);
        }
    }

    function resetData() {
        currentData = null;
        weatherData = null;

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) uploadArea.style.display = 'block';

        const resetContainer = document.querySelector('.upload-reset-container');
        if (resetContainer) resetContainer.style.display = 'none';

        const csvFile = document.getElementById('csvFile');
        if (csvFile) csvFile.value = '';

        const sectionIds = [
            'energyFlowSection',
            'metricsSection',
            'chartsSection',
            'calculatorSection',
            'tableSection',
            'weatherIndicator'
        ];

        sectionIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        const statusMsg = document.getElementById('statusMessage');
        if (statusMsg) {
            statusMsg.textContent = '';
            statusMsg.className = 'status-message';
        }

        window.location.reload();
    }

    function showUploadReset(filename) {
        const uploadArea = document.getElementById('uploadArea');
        const resetContainer = document.querySelector('.upload-reset-container');

        if (uploadArea) uploadArea.style.display = 'none';
        if (resetContainer) {
            resetContainer.style.display = 'block';
            const fileNameEl = document.getElementById('loadedFileName');
            if (fileNameEl) fileNameEl.textContent = `📁 ${filename}`;
        }
    }

    function createUnitToggle() {
        const toggleHTML = `
      <div id="unitToggleMenu" class="unit-toggle-menu">
        <button id="toggleMenuBtn" class="toggle-menu-btn" title="Toggle unit settings">⚙️</button>
        <div class="toggle-menu-content" style="display: none;">
          <div class="toggle-item">
            <label>Energy Unit:</label>
            <select id="energyUnit" class="unit-select">
              <option value="W">Watts (W)</option>
              <option value="kW">Kilowatts (kW)</option>
            </select>
          </div>
          <div class="toggle-item">
            <label>Daily Energy:</label>
            <select id="dailyEnergyUnit" class="unit-select">
              <option value="Wh">Watt-hours (Wh)</option>
              <option value="kWh">Kilowatt-hours (kWh)</option>
              <option value="MWh">Megawatt-hours (MWh)</option>
            </select>
          </div>
          <div class="toggle-item">
            <label>Emissions:</label>
            <select id="emissionUnit" class="unit-select">
              <option value="kg">Kilograms (kg)</option>
              <option value="ton">Metric Tons (ton)</option>
              <option value="g">Grams (g)</option>
            </select>
          </div>
          <div class="toggle-item">
            <label>
              <input type="checkbox" id="useMockWeather" />
              Use Mock Weather Data
            </label>
          </div>
        </div>
      </div>
    `;
        document.body.insertAdjacentHTML('afterbegin', toggleHTML);

        const toggleBtn = document.getElementById('toggleMenuBtn');
        const content = document.querySelector('.toggle-menu-content');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (content) {
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                }
            });
        }

        // Store preferences in localStorage and dispatch change event
        ['energyUnit', 'dailyEnergyUnit', 'emissionUnit', 'useMockWeather'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const saved = localStorage.getItem(`units_${id}`);
            if (saved) {
                if (id === 'useMockWeather') {
                    el.checked = saved === 'true';
                } else {
                    el.value = saved;
                }
            }

            el.addEventListener('change', () => {
                const value = (id === 'useMockWeather') ? el.checked : el.value;
                localStorage.setItem(`units_${id}`, value);
                window.dispatchEvent(new Event('unitsChanged'));
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('unitToggleMenu');
            if (menu && !menu.contains(e.target)) {
                if (content) content.style.display = 'none';
            }
        });
    }

    function convertUnit(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;

        const conversions = {
            'W_kW': v => v / 1000,
            'kW_W': v => v * 1000,
            'Wh_kWh': v => v / 1000,
            'Wh_MWh': v => v / 1000000,
            'kWh_Wh': v => v * 1000,
            'kWh_MWh': v => v / 1000,
            'MWh_Wh': v => v * 1000000,
            'MWh_kWh': v => v * 1000,
            'kg_ton': v => v / 1000,
            'kg_g': v => v * 1000,
            'ton_kg': v => v * 1000,
            'ton_g': v => v * 1000000,
            'g_kg': v => v / 1000,
            'g_ton': v => v / 1000000
        };

        const key = `${fromUnit}_${toUnit}`;
        return conversions[key] ? conversions[key](value) : value;
    }

    function getUnitSettings() {
        return {
            energy: (document.getElementById('energyUnit')?.value) || 'W',
            dailyEnergy: (document.getElementById('dailyEnergyUnit')?.value) || 'kWh',
            emission: (document.getElementById('emissionUnit')?.value) || 'kg',
            useMockWeather: (document.getElementById('useMockWeather')?.checked) || false
        };
    }

    function updateMetricUnits() {
        const units = getUnitSettings();
        // Update all metric unit labels
        const unitLabels = document.querySelectorAll('.metric-unit');
        unitLabels.forEach(label => {
            if (label.textContent === 'W') {
                label.textContent = units.energy;
            } else if (label.textContent === 'kWh/day') {
                label.textContent = units.dailyEnergy + '/day';
            } else if (label.textContent === 'kg/day') {
                label.textContent = units.emission + '/day';
            }
        });

        // Update flow node labels
        const flowUnits = document.querySelectorAll('.energy-node-value');
        flowUnits.forEach(node => {
            const text = node.textContent;
            if (text.includes('W') && !text.includes('%')) {
                const match = text.match(/(\d+(?:\.\d+)?)/);
                if (match) {
                    const value = parseFloat(match[0]);
                    const converted = convertUnit(value, 'W', units.energy);
                    node.textContent = Math.round(converted) + ' ' + units.energy;
                }
            }
        });
    }

    return {
        init() {
            createUploadReset();
            createUnitToggle();
        },
        setCurrentData(data) {
            currentData = data;
        },
        setWeatherData(data) {
            weatherData = data;
        },
        showUploadReset,
        getUnitSettings,
        convertUnit,
        updateMetricUnits,
        getCurrentData: () => currentData,
        getWeatherData: () => weatherData
    };
})();