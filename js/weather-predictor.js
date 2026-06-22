const WeatherPredictor = (() => {
    const MOCK_DATA = {
        forecast: [
            { cloudCover: 0.3, temp: 26, humidity: 65, windSpeed: 3 },
            { cloudCover: 0.6, temp: 25, humidity: 70, windSpeed: 4 },
            { cloudCover: 0.2, temp: 28, humidity: 60, windSpeed: 2 },
            { cloudCover: 0.8, temp: 24, humidity: 75, windSpeed: 5 },
            { cloudCover: 0.4, temp: 27, humidity: 62, windSpeed: 3 },
            { cloudCover: 0.1, temp: 29, humidity: 55, windSpeed: 2 },
            { cloudCover: 0.5, temp: 26, humidity: 68, windSpeed: 4 }
        ]
    };

    // 10 Weather Data Sources
    const weatherSources = {
        openmeteo: {
            name: 'Open-Meteo',
            url: (lat, lon) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,cloudcover,windspeed_10m,relative_humidity_2m&timezone=auto&forecast_days=7`,
            parse: (data) => data.daily.time.map((date, i) => ({
                date,
                cloudCover: (data.daily.cloudcover[i] || 50) / 100,
                temp: data.daily.temperature_2m_max[i] || 25,
                humidity: data.daily.relative_humidity_2m[i] || 60,
                windSpeed: data.daily.windspeed_10m[i] || 3
            }))
        },
        weatherapi: {
            name: 'WeatherAPI.com',
            url: (lat, lon) => `https://api.weatherapi.com/v1/forecast.json?key=DEMO_KEY&q=${lat},${lon}&days=7&aqi=no`,
            parse: (data) => data.forecast.forecastday.map((day, i) => ({
                date: day.date,
                cloudCover: day.day.cloud / 100,
                temp: day.day.maxtemp_c,
                humidity: day.day.avg_humidity,
                windSpeed: day.day.maxwind_kmh / 3.6 // Convert to m/s
            }))
        },
        wttr: {
            name: 'wttr.in',
            url: (lat, lon) => `https://wttr.in/?${lat},${lon}&format=j1`,
            parse: (data) => data.current_condition[0].forecast[0].forecastday.slice(0, 7).map(day => ({
                date: day.date,
                cloudCover: day.astronomy[0].cloud_cover / 100,
                temp: (day.maxtempC + day.mintempC) / 2,
                humidity: day.avg_humidity,
                windSpeed: day.maxwindKmph / 3.6
            }))
        },
        weatherbit: {
            name: 'WeatherBit (Free)',
            url: (lat, lon) => `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=7&key=DEMO_KEY`,
            parse: (data) => data.data.map(day => ({
                date: day.datetime,
                cloudCover: day.clouds / 100,
                temp: (day.high_temp + day.low_temp) / 2,
                humidity: day.rh,
                windSpeed: day.wind_spd
            }))
        },
        openweathermap: {
            name: 'OpenWeatherMap (Free)',
            url: (lat, lon) => `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=DEMO_KEY&units=metric`,
            parse: (data) => {
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
                    const humidities = dayData.map(d => d.main.humidity);
                    const winds = dayData.map(d => d.wind.speed);
                    return {
                        date,
                        cloudCover: clouds.reduce((a, b) => a + b) / clouds.length / 100,
                        temp: (Math.max(...temps) + Math.min(...temps)) / 2,
                        humidity: humidities.reduce((a, b) => a + b) / humidities.length,
                        windSpeed: winds.reduce((a, b) => a + b) / winds.length
                    };
                });
            }
        },
        visualcrossing: {
            name: 'Visual Crossing (Free)',
            url: (lat, lon) => `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast?locations=${lat},${lon}&include=days&key=DEMO_KEY&contentType=json`,
            parse: (data) => data.locations[Object.keys(data.locations)[0]].values.slice(0, 7).map(day => ({
                date: day.datetime,
                cloudCover: day.cloudcover / 100,
                temp: (day.maxtempC + day.mintempC) / 2,
                humidity: day.humidity,
                windSpeed: day.windspeed
            }))
        },
        weathergovusa: {
            name: 'Weather.gov (USA only)',
            url: (lat, lon) => `https://api.weather.gov/points/${lat},${lon}`,
            parse: (data) => data.properties.forecast // This requires additional parsing
        },
        tomorrow: {
            name: 'Tomorrow.io (Free Tier)',
            url: (lat, lon) => `https://api.weatherapi.com/v1/forecast.json?key=DEMO&q=${lat},${lon}&days=7`,
            parse: (data) => data.forecast.forecastday.map(day => ({
                date: day.date,
                cloudCover: day.day.cloud / 100,
                temp: day.day.avgtemp_c,
                humidity: day.day.avg_humidity,
                windSpeed: day.day.avgvis_km / 1000 // Approximate
            }))
        },
        climacell: {
            name: 'ClimaCell (Requires API Key)',
            url: (lat, lon) => `https://api.climacell.co/v3/weather/forecast/daily?lat=${lat}&lon=${lon}&unit_system=metric&fields=temp,humidity,wind_speed,cloud_cover&apikey=DEMO_KEY`,
            parse: (data) => data.slice(0, 7).map(day => ({
                date: day.observation_time.split('T')[0],
                cloudCover: day.cloud_cover.value / 100,
                temp: (day.temp.max.value + day.temp.min.value) / 2,
                humidity: day.humidity.value,
                windSpeed: day.wind_speed.max.value
            }))
        },
        weatherstack: {
            name: 'Weatherstack (Free)',
            url: (lat, lon) => `http://api.weatherstack.com/forecast?access_key=DEMO_KEY&query=${lat},${lon}&forecast_days=7`,
            parse: (data) => data.forecast.forecastday.slice(0, 7).map(day => ({
                date: day.date,
                cloudCover: day.day.cloud_cover / 100,
                temp: day.day.avg_temp,
                humidity: day.day.avg_humidity,
                windSpeed: day.day.max_wind_kph / 3.6
            }))
        }
    };

    async function fetchFromSource(source, latitude, longitude) {
        try {
            const sourceConfig = weatherSources[source];
            if (!sourceConfig) throw new Error(`Unknown source: ${source}`);

            const url = sourceConfig.url(latitude, longitude);
            const response = await fetch(url, { timeout: 8000 });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const forecast = sourceConfig.parse(data);

            return {
                source: sourceConfig.name,
                forecast: forecast.slice(0, 7),
                success: true
            };
        } catch (error) {
            console.warn(`Weather source ${source} failed:`, error);
            return { success: false, error: error.message };
        }
    }

    async function tryMultipleSources(latitude, longitude, selectedSource) {
        if (selectedSource === 'mock') {
            return {
                source: 'Mock Data',
                forecast: MOCK_DATA.forecast.map((item, i) => ({
                    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    ...item
                }))
            };
        }

        // Try selected source first
        if (selectedSource !== 'auto') {
            const result = await fetchFromSource(selectedSource, latitude, longitude);
            if (result.success) return result;
        }

        // Auto-select: try sources in order
        const sourceOrder = ['openmeteo', 'weatherapi', 'wttr', 'weatherbit', 'openweathermap'];
        for (const src of sourceOrder) {
            const result = await fetchFromSource(src, latitude, longitude);
            if (result.success) return result;
        }

        // Fallback to mock
        return {
            source: 'Mock Data (API Unavailable)',
            forecast: MOCK_DATA.forecast.map((item, i) => ({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                ...item
            }))
        };
    }

    return {
        async getWeatherForecast(latitude = 14.5995, longitude = 120.9842, selectedSource = 'auto') {
            return tryMultipleSources(latitude, longitude, selectedSource);
        },

        getMockForecast() {
            return {
                source: 'Mock Data',
                forecast: MOCK_DATA.forecast.map((item, i) => ({
                    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    ...item
                }))
            };
        }
    };
})();