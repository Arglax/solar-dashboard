// ============================================================
// Battery Optimizer - Advanced battery analysis and optimization
// ============================================================

const BatteryOptimizer = (() => {
    const CONFIG = {
        BATTERY_CAPACITY: 10,
        MAX_CHARGE_RATE: 3,
        MAX_DISCHARGE_RATE: 3,
        MIN_SOC: 0.2,
        MAX_SOC: 0.95,
        ELECTRICITY_RATE_PHP: 11.50,
        FEED_IN_RATE_PHP: 5.75
    };

    /**
     * Analyze battery performance from daily data
     */
    function analyze(dailyData, weatherForecast = []) {
        const stats = {
            optimalChargeWindows: [],
            optimalDischargeWindows: [],
            gridFeedInPotential: 0,
            gridFeedInRevenue: 0,
            weeklyProjection: {
                avgGeneration: 0,
                avgConsumption: 0,
                avgGridImport: 0,
                avgGridExport: 0,
                projectedSavings: 0,
                projectedRevenue: 0
            },
            monthlyProjection: {
                avgGeneration: 0,
                avgConsumption: 0,
                avgGridImport: 0,
                avgGridExport: 0,
                projectedSavings: 0,
                projectedRevenue: 0
            }
        };

        let totalPV = 0;
        let totalLoad = 0;
        let chargeWindows = 0;
        let dischargeWindows = 0;
        let gridFeedIn = 0;

        // Analyze data
        dailyData.forEach((row, idx) => {
            const pv = row.pv || 0;
            const load = row.load || 0;
            const grid = row.grid || 0;
            const soc = row.soc || 50;

            totalPV += pv;
            totalLoad += load;

            // Charge opportunities (PV > Load, SOC < 95%)
            if (pv > load && soc < 95) {
                chargeWindows += (pv - load);
                if (stats.optimalChargeWindows.length < 5) {
                    stats.optimalChargeWindows.push({
                        time: row.time || `${idx}:00`,
                        surplus: Math.round((pv - load) * 100) / 100,
                        soc: Math.round(soc * 100) / 100
                    });
                }
            }

            // Discharge opportunities (Load > PV, SOC > 20%)
            if (load > pv && soc > 20) {
                dischargeWindows += (load - pv);
                if (stats.optimalDischargeWindows.length < 5) {
                    stats.optimalDischargeWindows.push({
                        time: row.time || `${idx}:00`,
                        demand: Math.round((load - pv) * 100) / 100,
                        soc: Math.round(soc * 100) / 100
                    });
                }
            }

            // Grid feed-in potential
            if (pv > load && soc >= 95) {
                const excess = pv - load;
                gridFeedIn += excess;
                stats.gridFeedInPotential += excess / 1000;
            }
        });

        // Sort by value
        stats.optimalChargeWindows.sort((a, b) => b.surplus - a.surplus);
        stats.optimalDischargeWindows.sort((a, b) => b.demand - a.demand);

        // Calculate financial metrics
        const dailyPVkWh = totalPV / 12 / 1000;
        const dailyLoadkWh = totalLoad / 12 / 1000;

        stats.gridFeedInRevenue = stats.gridFeedInPotential * CONFIG.FEED_IN_RATE_PHP;

        // Weekly projection
        stats.weeklyProjection.avgGeneration = Math.round(dailyPVkWh * 7 * 100) / 100;
        stats.weeklyProjection.avgConsumption = Math.round(dailyLoadkWh * 7 * 100) / 100;
        stats.weeklyProjection.avgGridImport = Math.round(Math.max(0, (dailyLoadkWh - dailyPVkWh) * 7) * 100) / 100;
        stats.weeklyProjection.avgGridExport = Math.round(stats.gridFeedInPotential * 7 * 100) / 100;
        stats.weeklyProjection.projectedSavings = Math.round(stats.weeklyProjection.avgGeneration * CONFIG.ELECTRICITY_RATE_PHP * 100) / 100;
        stats.weeklyProjection.projectedRevenue = Math.round(stats.weeklyProjection.avgGridExport * CONFIG.FEED_IN_RATE_PHP * 100) / 100;

        // Monthly projection
        const weekMultiplier = 4.33;
        stats.monthlyProjection.avgGeneration = Math.round(stats.weeklyProjection.avgGeneration * weekMultiplier * 100) / 100;
        stats.monthlyProjection.avgConsumption = Math.round(stats.weeklyProjection.avgConsumption * weekMultiplier * 100) / 100;
        stats.monthlyProjection.avgGridImport = Math.round(stats.weeklyProjection.avgGridImport * weekMultiplier * 100) / 100;
        stats.monthlyProjection.avgGridExport = Math.round(stats.weeklyProjection.avgGridExport * weekMultiplier * 100) / 100;
        stats.monthlyProjection.projectedSavings = Math.round(stats.weeklyProjection.projectedSavings * weekMultiplier * 100) / 100;
        stats.monthlyProjection.projectedRevenue = Math.round(stats.weeklyProjection.projectedRevenue * weekMultiplier * 100) / 100;

        return stats;
    }

    /**
     * Format battery report as readable text
     */
    function formatBatteryReport(stats) {
        const lines = [
            '⚡ BATTERY OPTIMIZATION ANALYSIS',
            '═══════════════════════════════════',
            '',
            '📊 OPTIMAL CHARGE WINDOWS:',
            `Found ${stats.optimalChargeWindows.length} charge opportunity windows`
        ];

        if (stats.optimalChargeWindows.length > 0) {
            stats.optimalChargeWindows.forEach((w, i) => {
                lines.push(`  ${i + 1}. ${w.time} | Surplus: ${w.surplus} W | SOC: ${w.soc}%`);
            });
        } else {
            lines.push('  No charge opportunities detected');
        }

        lines.push('');
        lines.push('📤 OPTIMAL DISCHARGE WINDOWS:');
        lines.push(`Found ${stats.optimalDischargeWindows.length} discharge opportunity windows`);

        if (stats.optimalDischargeWindows.length > 0) {
            stats.optimalDischargeWindows.forEach((w, i) => {
                lines.push(`  ${i + 1}. ${w.time} | Demand: ${w.demand} W | SOC: ${w.soc}%`);
            });
        } else {
            lines.push('  No discharge opportunities detected');
        }

        lines.push('');
        lines.push('🔋 GRID FEED-IN POTENTIAL:');
        lines.push(`  Potential Export: ${stats.gridFeedInPotential.toFixed(2)} kWh`);
        lines.push(`  Revenue @ ₱${CONFIG.FEED_IN_RATE_PHP}/kWh: ₱${stats.gridFeedInRevenue.toFixed(2)}`);

        lines.push('');
        lines.push('📈 WEEKLY PROJECTIONS:');
        lines.push(`  Generation: ${stats.weeklyProjection.avgGeneration.toFixed(2)} kWh`);
        lines.push(`  Consumption: ${stats.weeklyProjection.avgConsumption.toFixed(2)} kWh`);
        lines.push(`  Grid Import: ${stats.weeklyProjection.avgGridImport.toFixed(2)} kWh`);
        lines.push(`  Grid Export: ${stats.weeklyProjection.avgGridExport.toFixed(2)} kWh`);
        lines.push(`  Projected Savings: ₱${stats.weeklyProjection.projectedSavings.toFixed(2)}`);
        lines.push(`  Revenue (Feed-in): ₱${stats.weeklyProjection.projectedRevenue.toFixed(2)}`);

        lines.push('');
        lines.push('📅 MONTHLY PROJECTIONS:');
        lines.push(`  Generation: ${stats.monthlyProjection.avgGeneration.toFixed(2)} kWh`);
        lines.push(`  Consumption: ${stats.monthlyProjection.avgConsumption.toFixed(2)} kWh`);
        lines.push(`  Grid Import: ${stats.monthlyProjection.avgGridImport.toFixed(2)} kWh`);
        lines.push(`  Grid Export: ${stats.monthlyProjection.avgGridExport.toFixed(2)} kWh`);
        lines.push(`  Projected Savings: ₱${stats.monthlyProjection.projectedSavings.toFixed(2)}`);
        lines.push(`  Revenue (Feed-in): ₱${stats.monthlyProjection.projectedRevenue.toFixed(2)}`);

        lines.push('');
        lines.push('💡 OPTIMIZATION TIPS:');
        lines.push('  • Maintain 40-80% SOC for optimal battery health');
        lines.push('  • Charge during peak solar hours (9 AM - 3 PM)');
        lines.push('  • Discharge during peak load hours if TOU rates apply');
        lines.push('  • Monitor SOC to avoid deep discharge degradation');

        return lines.join('\n');
    }

    /**
     * Generate table data for battery analysis
     */
    function generateTableData(stats) {
        return [
            { metric: 'Grid Feed-in Potential', value: `${stats.gridFeedInPotential.toFixed(2)} kWh` },
            { metric: 'Grid Revenue Potential', value: `₱${stats.gridFeedInRevenue.toFixed(2)}` },
            { metric: 'Weekly Generation', value: `${stats.weeklyProjection.avgGeneration.toFixed(2)} kWh` },
            { metric: 'Weekly Consumption', value: `${stats.weeklyProjection.avgConsumption.toFixed(2)} kWh` },
            { metric: 'Weekly Savings', value: `₱${stats.weeklyProjection.projectedSavings.toFixed(2)}` },
            { metric: 'Monthly Generation', value: `${stats.monthlyProjection.avgGeneration.toFixed(2)} kWh` },
            { metric: 'Monthly Savings', value: `₱${stats.monthlyProjection.projectedSavings.toFixed(2)}` },
            { metric: 'Charge Opportunities', value: stats.optimalChargeWindows.length },
            { metric: 'Discharge Opportunities', value: stats.optimalDischargeWindows.length }
        ];
    }

    return {
        analyze,
        formatBatteryReport,
        generateTableData,

        /**
         * Get configuration
         */
        getConfig() {
            return { ...CONFIG };
        },

        /**
         * Update configuration
         */
        updateConfig(updates) {
            Object.assign(CONFIG, updates);
        }
    };
})();
