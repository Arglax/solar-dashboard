// ============================================================
// Weather Predictor - Multi-source weather forecasting
// ============================================================

const WeatherPredictor = (() => {
    const MOCK_DATA = {
        forecast: [
            { date: new Date().toISOString().split('T')[0], cloudCover: 0.3, temp: 26, humidity: 65, windSpeed: 3 },
            { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], cloudCover: 0.6, temp: 25, humidity: 70, windSpeed: 4 },
            { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], cloudCover: 0.2, temp: 28, humidity: 60, windSpeed: 2 },
            { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], cloudCover: 0.8, temp: 24, humidity: 75, windSpeed: 5 },
            { date: new Date(Date.now() + 345600000).toISOString().split('T')[0], cloudCover: 0.4, temp: 27, humidity: 62, windSpeed: 3 },
            { date: new Date(Date.now() + 432000000).toISOString().split('T')[0], cloudCover: 0.1, temp: 29, humidity: 55, windSpeed: 2 },
            { date: new Date(Date.now() + 518400000).toISOString().split('T')[0], cloudCover: 0.5, temp: 26, humidity: 68, windSpeed: 4 }
        ]
    };

    const sources = {
        openmeteo: {
            name: 'Open-Meteo (Free)',
            url: (lat, lon) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,cloudcover,windspeed_10m&timezone=auto&forecast_days=7`,
            parse: (data) => {
                if (!data.daily || !data.daily.time) return null;
                return data.daily.time.map((date, i) => ({
                    date,
                    cloudCover: Math.min(1, (data.daily.cloudcover[i] || 50) / 100),
                    temp: data.daily.temperature_2m_max[i] || 25,
                    humidity: 60,
                    windSpeed: data.daily.windspeed_10m[i] || 3
                }));
            },
            timeout: 5000
        },
        openweathermap: {
            name: 'OpenWeatherMap',
            url: (lat, lon) => `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=85a4e3c55f1bb8c9eb4521bb89adc088&units=metric`,
            parse: (data) => {
                if (!data.list) return null;
                const daily = {};
                data.list.forEach(item => {
                    const date = item.dt_txt.split(' ')[0];
                    if (!daily[date]) daily[date] = [];
                    daily[date].push(item);
                });
                return Object.keys(daily).slice(0, 7).map(date => {
                    const dayData = daily[date];
                    const temps = dayData.map(d => d.main.temp);
                    const clouds = dayData.map(d => d.clouds.all);
                    return {
                        date,
                        cloudCover: Math.min(1, clouds.reduce((a, b) => a + b, 0) / clouds.length / 100),
                        temp: (Math.max(...temps) + Math.min(...temps)) / 2,
                        humidity: dayData[0].main.humidity || 60,
                        windSpeed: dayData[0].wind.speed || 3
                    };
                });
            },
            timeout: 5000
        },
        wttr: {
            name: 'wttr.in',
            url: (lat, lon) => `https://wttr.in/?${lat},${lon}&format=j1`,
            parse: (data) => {
                if (!data.current_condition) return null;
                try {
                    return data.current_condition[0].forecastday.slice(0, 7).map(day => ({
                        date: day.date,
                        cloudCover: Math.min(1, (day.astronomy[0].cloud_cover || 50) / 100),
                        temp: (day.maxtempC + day.mintempC) / 2,
                        humidity: day.avg_humidity || 60,
                        windSpeed: (day.maxwindKmph || 10) / 3.6
                    }));
                } catch (e) {
                    return null;
                }
            },
            timeout: 5000
        },
        weatherapi: {
            name: 'WeatherAPI.com',
            url: (lat, lon) => `https://api.weatherapi.com/v1/forecast.json?key=b8e5aa0b8ef44d74a84143842241306&q=${lat},${lon}&days=7&aqi=no`,
            parse: (data) => {
                if (!data.forecast || !data.forecast.forecastday) return null;
                return data.forecast.forecastday.slice(0, 7).map(day => ({
                    date: day.date,
                    cloudCover: Math.min(1, (day.day.cloud || 50) / 100),
                    temp: day.day.maxtemp_c || 25,
                    humidity: day.day.avg_humidity || 60,
                    windSpeed: (day.day.maxwind_kmh || 10) / 3.6
                }));
            },
            timeout: 5000
        }
    };

    /**
     * Fetch from a specific weather source with timeout
     */
    async function fetchFromSource(sourceKey, latitude, longitude) {
        const source = sources[sourceKey];
        if (!source) return null;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), source.timeout || 8000);

            const url = source.url(latitude, longitude);
            const response = await fetch(url, { signal: controller.signal });

            clearTimeout(timeout);

            if (!response.ok) return null;

            const data = await response.json();
            const forecast = source.parse(data);

            if (!forecast || forecast.length === 0) return null;

            return {
                source: source.name,
                forecast: forecast.slice(0, 7),
                success: true
            };
        } catch (error) {
            console.warn(`Weather source '${sourceKey}' failed:`, error.message);
            return null;
        }
    }

    /**
     * Try multiple sources in fallback chain
     */
    async function tryMultipleSources(latitude, longitude, selectedSource = 'auto') {
        // Force mock if requested
        if (selectedSource === 'mock') {
            return {
                source: 'Mock Data',
                forecast: MOCK_DATA.forecast
            };
        }

        // Try selected source first if specified
        if (selectedSource && selectedSource !== 'auto') {
            const result = await fetchFromSource(selectedSource, latitude, longitude);
            if (result && result.success) return result;
        }

        // Fallback chain
        const sourceOrder = ['openmeteo', 'openweathermap', 'weatherapi', 'wttr'];
        
        for (const src of sourceOrder) {
            const result = await fetchFromSource(src, latitude, longitude);
            if (result && result.success) return result;
        }

        // Final fallback to mock data
        return {
            source: 'Mock Data (APIs Unavailable)',
            forecast: MOCK_DATA.forecast
        };
    }

    return {
        /**
         * Get weather forecast with automatic source selection
         * @param {number} latitude - Location latitude (default: Quezon City)
         * @param {number} longitude - Location longitude
         * @param {string} selectedSource - Preferred source or 'auto'
         */
        async getWeatherForecast(latitude = 14.5995, longitude = 120.9842, selectedSource = 'auto') {
            return await tryMultipleSources(latitude, longitude, selectedSource);
        },

        /**
         * Get mock forecast (for testing/offline)
         */
        getMockForecast() {
            return {
                source: 'Mock Data',
                forecast: MOCK_DATA.forecast
            };
        },

        /**
         * List available weather sources
         */
        getAvailableSources() {
            return Object.keys(sources).map(key => ({
                id: key,
                name: sources[key].name
            }));
        }
    };
})();
