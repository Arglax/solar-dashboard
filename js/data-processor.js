const DataProcessor = (() => {
    // Detect and normalize CSV format
    function detectFormat(headers) {
        const hasDaily = headers.some(h => h.includes('Battery SOC(%)'));
        const hasWeekly = headers.some(h => h.includes('Battery charge(kWh)'));

        if (hasDaily) return 'daily';
        if (hasWeekly) return 'weekly';
        return null;
    }

    // Normalize daily data
    function normalizeDailyData(data, headers) {
        return data.map(row => ({
            time: row.Time || '',
            pv: parseFloat(row['PV(W)'] || 0) || 0,
            grid: parseFloat(row['Grid(W)'] || 0) || 0,
            battery: parseFloat(row['Battery(W)'] || 0) || 0,
            load: parseFloat(row['Load(W)'] || 0) || 0,
            soc: parseFloat(row['Battery SOC(%)'] || 0) || 0
        }));
    }

    // Normalize weekly data
    function normalizeWeeklyData(data, headers) {
        return data.map(row => ({
            date: row.Time || '',
            pv: parseFloat(row['PV(kWh)'] || 0) || 0,
            purchase: parseFloat(row['Energy purchase(kWh)'] || 0) || 0,
            feedIn: parseFloat(row['Feed-in(kWh)'] || 0) || 0,
            charge: parseFloat(row['Battery charge(kWh)'] || 0) || 0,
            discharge: parseFloat(row['Battery discharge(kWh)'] || 0) || 0,
            load: parseFloat(row['Load(kWh)'] || 0) || 0
        }));
    }

    // Generate predictive weekly data based on daily data
    function generatePredictiveWeekly(dailyData, weatherForecast) {
        const weeklyData = [];
        const daysInWeek = 7;

        for (let i = 0; i < daysInWeek; i++) {
            const weather = weatherForecast[i] || {};
            const cloudCover = weather.cloudCover || 0.5;
            const temp = weather.temp || 25;

            // Calculate PV generation with weather factor
            const avgDailyPV = dailyData.reduce((sum, d) => sum + d.pv, 0) / dailyData.length;
            const tempFactor = Math.max(0.8, 1 - (temp - 25) * 0.02); // Temp affects efficiency
            const weatherFactor = Math.max(0.1, 1 - cloudCover); // Cloud cover affects output
            const predictedPV = (avgDailyPV * 12 * 5 / 60 / 1000) * tempFactor * weatherFactor; // Convert to kWh

            // Calculate battery behavior
            const avgLoad = dailyData.reduce((sum, d) => sum + d.load, 0) / dailyData.length;
            const avgDailyLoad = (avgLoad * 12 * 5 / 60 / 1000); // Convert to kWh

            const charge = Math.max(0, predictedPV * 0.6); // 60% goes to charging
            const discharge = Math.max(0, avgDailyLoad * 0.4); // 40% from battery
            const purchase = Math.max(0, avgDailyLoad - predictedPV);
            const feedIn = Math.max(0, predictedPV - avgDailyLoad);

            weeklyData.push({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                pv: Math.round(predictedPV * 100) / 100,
                purchase: Math.round(purchase * 100) / 100,
                feedIn: Math.round(feedIn * 100) / 100,
                charge: Math.round(charge * 100) / 100,
                discharge: Math.round(discharge * 100) / 100,
                load: Math.round(avgDailyLoad * 100) / 100,
                isPredicted: true
            });
        }

        return weeklyData;
    }

    return {
        processFile(rawData, headers) {
            const format = detectFormat(headers);

            if (!format) {
                throw new Error('Unrecognized CSV format. Please check your file.');
            }

            const normalized = format === 'daily'
                ? normalizeDailyData(rawData, headers)
                : normalizeWeeklyData(rawData, headers);

            return {
                format,
                data: normalized,
                rawHeaders: headers
            };
        },

        generateWeeklyForecast(dailyData, weatherForecast) {
            return generatePredictiveWeekly(dailyData, weatherForecast);
        }
    };
})();