const BatteryOptimizer = (() => {
    const CONFIG = {
        BATTERY_CAPACITY: 10, // kWh (default, adjust as needed)
        MAX_CHARGE_RATE: 3, // kW
        MAX_DISCHARGE_RATE: 3, // kW
        MIN_SOC: 0.2, // 20% minimum
        MAX_SOC: 0.95, // 95% maximum
        ELECTRICITY_RATE_PHP: 11.50,
        FEED_IN_RATE_PHP: 5.75
    };

    function analyze(dailyData, weatherForecast) {
        const batteryStats = {
            optimalChargeWindows: [],
            optimalDischargeWindows: [],
            gridFeedInPotential: 0, // kWh
            gridFeedInRevenue: 0, // PHP
            missedSavingsOpportunities: 0, // PHP
            weeklyProjection: {
                avgGeneration: 0, // kWh
                avgConsumption: 0, // kWh
                avgGridImport: 0, // kWh
                avgGridExport: 0, // kWh
                projectedSavings: 0, // PHP
                projectedRevenue: 0 // PHP
            }
        };

        // Analyze daily data for patterns
        let totalPV = 0;
        let totalLoad = 0;
        let totalBattery = 0;
        let chargeOpportunities = 0;
        let dischargeOpportunities = 0;
        let gridFeedIn = 0;

        dailyData.forEach((row, idx) => {
            const pv = row.pv || 0;
            const load = row.load || 0;
            const grid = row.grid || 0;
            const battery = row.battery || 0;
            const soc = row.soc || 0;

            totalPV += pv;
            totalLoad += load;
            totalBattery += battery;

            // Detect optimal charge windows (PV > Load and SOC < 95%)
            if (pv > load && soc < 95) {
                chargeOpportunities += (pv - load);
                batteryStats.optimalChargeWindows.push({
                    time: row.time,
                    surplus: pv - load,
                    soc: soc
                });
            }

            // Detect optimal discharge windows (Load > PV and SOC > 20%)
            if (load > pv && soc > 20) {
                dischargeOpportunities += (load - pv);
                batteryStats.optimalDischargeWindows.push({
                    time: row.time,
                    demand: load - pv,
                    soc: soc
                });
            }

            // Detect grid feed-in potential (excess PV when battery is at 100%)
            if (pv > load && soc >= 95) {
                const excess = pv - load;
                gridFeedIn += excess;
                batteryStats.gridFeedInPotential += excess / 1000; // Convert to kWh
            }
        });

        // Calculate financial metrics
        const dailyPVkWh = totalPV / 12 / 1000; // Convert W*intervals to kWh
        const dailyLoadkWh = totalLoad / 12 / 1000;
        const dailyGridFeedinRatio = batteryStats.gridFeedInPotential / Math.max(dailyPVkWh, 1);

        batteryStats.gridFeedInRevenue = batteryStats.gridFeedInPotential * CONFIG.FEED_IN_RATE_PHP;
        batteryStats.missedSavingsOpportunities = batteryStats.gridFeedInPotential * CONFIG.ELECTRICITY_RATE_PHP;

        // Weekly projection
        batteryStats.weeklyProjection.avgGeneration = dailyPVkWh * 7;
        batteryStats.weeklyProjection.avgConsumption = dailyLoadkWh * 7;
        batteryStats.weeklyProjection.avgGridImport = Math.max(0, (dailyLoadkWh - dailyPVkWh) * 7);
        batteryStats.weeklyProjection.avgGridExport = batteryStats.gridFeedInPotential * 7;
        batteryStats.weeklyProjection.projectedSavings = (batteryStats.weeklyProjection.avgGeneration - batteryStats.weeklyProjection.avgGridImport) * CONFIG.ELECTRICITY_RATE_PHP;
        batteryStats.weeklyProjection.projectedRevenue = batteryStats.weeklyProjection.avgGridExport * CONFIG.FEED_IN_RATE_PHP;

        // Monthly projection
        batteryStats.monthlyProjection = {
            avgGeneration: batteryStats.weeklyProjection.avgGeneration * 4.33,
            avgConsumption: batteryStats.weeklyProjection.avgConsumption * 4.33,
            avgGridImport: batteryStats.weeklyProjection.avgGridImport * 4.33,
            avgGridExport: batteryStats.weeklyProjection.avgGridExport * 4.33,
            projectedSavings: batteryStats.weeklyProjection.projectedSavings * 4.33,
            projectedRevenue: batteryStats.weeklyProjection.projectedRevenue * 4.33
        };

        // Optimize charge/discharge windows
        batteryStats.optimalChargeWindows = batteryStats.optimalChargeWindows
            .sort((a, b) => b.surplus - a.surplus)
            .slice(0, 5); // Top 5 charge opportunities

        batteryStats.optimalDischargeWindows = batteryStats.optimalDischargeWindows
            .sort((a, b) => b.demand - a.demand)
            .slice(0, 5); // Top 5 discharge opportunities

        return batteryStats;
    }

    function formatBatteryReport(stats) {
        return `
    ⚡ BATTERY OPTIMIZATION REPORT
    
    CHARGING RECOMMENDATIONS:
    Optimal charge windows: ${stats.optimalChargeWindows.length}
    Best charging times:
    ${stats.optimalChargeWindows.map((w, i) => `  ${i + 1}. ${w.time} (${(w.surplus / 1000).toFixed(2)} kW surplus)`).join('\n')}
    
    DISCHARGING RECOMMENDATIONS:
    Optimal discharge windows: ${stats.optimalDischargeWindows.length}
    Best discharging times:
    ${stats.optimalDischargeWindows.map((w, i) => `  ${i + 1}. ${w.time} (${(w.demand / 1000).toFixed(2)} kW needed)`).join('\n')}
    
    GRID FEED-IN POTENTIAL:
    Potential feed-in energy: ${stats.gridFeedInPotential.toFixed(2)} kWh
    Potential revenue: ₱${stats.gridFeedInRevenue.toFixed(2)}
    
    WEEKLY PROJECTION:
    Generation: ${stats.weeklyProjection.avgGeneration.toFixed(2)} kWh
    Consumption: ${stats.weeklyProjection.avgConsumption.toFixed(2)} kWh
    Grid Import: ${stats.weeklyProjection.avgGridImport.toFixed(2)} kWh
    Grid Export: ${stats.weeklyProjection.avgGridExport.toFixed(2)} kWh
    Savings: ₱${stats.weeklyProjection.projectedSavings.toFixed(2)}
    Revenue: ₱${stats.weeklyProjection.projectedRevenue.toFixed(2)}
    
    MONTHLY PROJECTION:
    Generation: ${stats.monthlyProjection.avgGeneration.toFixed(2)} kWh
    Consumption: ${stats.monthlyProjection.avgConsumption.toFixed(2)} kWh
    Grid Import: ${stats.monthlyProjection.avgGridImport.toFixed(2)} kWh
    Grid Export: ${stats.monthlyProjection.avgGridExport.toFixed(2)} kWh
    Savings: ₱${stats.monthlyProjection.projectedSavings.toFixed(2)}
    Revenue: ₱${stats.monthlyProjection.projectedRevenue.toFixed(2)}
    `;
    }

    return {
        analyze,
        formatBatteryReport
    };
})();