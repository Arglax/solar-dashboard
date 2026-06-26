// ============================================================
// UI Manager - Utility functions for UI enhancements
// ============================================================

const UIManager = (() => {
    /**
     * Unit conversion system
     */
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

    /**
     * Convert value between units
     */
    function convertUnit(value, fromUnit, toUnit) {
        if (fromUnit === toUnit) return value;
        const key = `${fromUnit}_${toUnit}`;
        return conversions[key] ? conversions[key](value) : value;
    }

    /**
     * Get current unit settings from localStorage
     */
    function getUnitSettings() {
        return {
            energy: localStorage.getItem('unit_energy') || 'W',
            dailyEnergy: localStorage.getItem('unit_dailyEnergy') || 'kWh',
            emission: localStorage.getItem('unit_emission') || 'kg',
            useMockWeather: localStorage.getItem('unit_mockWeather') === 'true'
        };
    }

    /**
     * Save unit settings to localStorage
     */
    function setUnitSettings(units) {
        Object.entries(units).forEach(([key, value]) => {
            localStorage.setItem(`unit_${key}`, String(value));
        });
    }

    /**
     * Format number with locale
     */
    function formatNumber(value, decimals = 2) {
        return Number(value).toLocaleString('en-PH', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Format currency (PHP)
     */
    function formatCurrency(value) {
        return '₱' + formatNumber(value, 2);
    }

    /**
     * Create loading spinner HTML
     */
    function createSpinner() {
        return '<div class="spinner"></div>';
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info', duration = 3000) {
        const statusEl = document.getElementById('statusMessage');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `status-message show ${type}`;

        if (duration > 0) {
            setTimeout(() => {
                statusEl.classList.remove('show');
            }, duration);
        }
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    return {
        convertUnit,
        getUnitSettings,
        setUnitSettings,
        formatNumber,
        formatCurrency,
        createSpinner,
        showNotification,
        debounce,
        throttle,

        /**
         * Initialize unit toggle menu
         */
        initUnitToggle() {
            const toggleBtn = document.getElementById('toggleMenuBtn');
            const content = document.querySelector('.toggle-menu-content');

            if (!toggleBtn || !content) return;

            toggleBtn.addEventListener('click', () => {
                content.classList.toggle('show');
            });

            // Load saved settings
            const settings = getUnitSettings();
            document.getElementById('energyUnit').value = settings.energy;
            document.getElementById('dailyEnergyUnit').value = settings.dailyEnergy;
            document.getElementById('emissionUnit').value = settings.emission;
            document.getElementById('useMockWeather').checked = settings.useMockWeather;

            // Save on change
            document.querySelectorAll('.unit-select, #useMockWeather').forEach(el => {
                el.addEventListener('change', () => {
                    const newSettings = {
                        energy: document.getElementById('energyUnit').value,
                        dailyEnergy: document.getElementById('dailyEnergyUnit').value,
                        emission: document.getElementById('emissionUnit').value,
                        useMockWeather: document.getElementById('useMockWeather').checked
                    };
                    setUnitSettings(newSettings);
                    window.dispatchEvent(new Event('unitsChanged'));
                });
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('unitToggleMenu');
                if (menu && !menu.contains(e.target)) {
                    content.classList.remove('show');
                }
            });
        }
    };
})();

// Initialize UI manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UIManager.initUnitToggle();
});
