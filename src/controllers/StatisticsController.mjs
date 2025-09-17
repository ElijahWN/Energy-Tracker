import express from "express";
import path from "path";
import RegionPowerModel from "../models/RegionPowerModel.mjs";
import UtilsController from "../models/UtilsController.mjs";
import ApplianceTypeModel from "../models/ApplianceTypeModel.mjs";
import LeaderboardItemModel from "../models/LeaderboardItemModel.mjs";

/**
 * Controller for handling statistics-related requests.
 * It serves the public statistics page and provides overall statistics data.
 */
export default class StatisticsController {
    /**
     * Serves the static public statistics HTML page.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static serveStatisticsPage(req, res) {
        res.sendFile(
            path.join(
                import.meta.dirname,
                "../public/views/PublicStatisticsView.html"
            )
        );
    }

    /**
     * Fetches all uploaded leaderboard entries and aggregates statistics.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static getAggregatedStats(req, res) {
            const entries = LeaderboardItemModel.data || [];

            if (!entries || entries.length === 0) {
                return res.json({
                    totalEnergy: 0,
                    stateData: [],
                    sourceData: [],
                    applianceData: [],
                });
            }

            const totalRegionPower = {};
            const totalAppliances = {};
            let grandTotalPower = 0;
        let error = null;

            entries.forEach((entry) => {
                const locationPower = UtilsController.getLocationPower(
                    entry.appliances
                );
                grandTotalPower += locationPower;
                const regionName = entry.region || "Unknown";

                if (!totalRegionPower[regionName]) {
                    totalRegionPower[regionName] = 0;
                }
                totalRegionPower[regionName] += locationPower;

                (entry.appliances || []).forEach((app) => {
                    const appPower = UtilsController.getAppliancePower(app);
                    const appTypeName = app.type?.name || "Unknown";
                    if (!totalAppliances[appTypeName]) {
                        totalAppliances[appTypeName] = 0;
                    }
                    totalAppliances[appTypeName] += appPower;
                });
            });

            const totalPowerSources = {};
            const regionPowerData = RegionPowerModel.data || [];
            regionPowerData.forEach((regionPower) => {
                const regionTotal = totalRegionPower[regionPower.name] || 0;
                if (regionTotal > 0) {
                    Object.entries(regionPower.powerSources || {}).forEach(
                        ([sourceName, percentage]) => {
                            const capitalizedSourceName =
                                sourceName.charAt(0).toUpperCase() +
                                sourceName.slice(1);
                            if (!totalPowerSources[capitalizedSourceName]) {
                                totalPowerSources[capitalizedSourceName] = 0;
                            }
                            totalPowerSources[capitalizedSourceName] +=
                                regionTotal * (Number(percentage || 0) / 100);
                        }
                    );
                }
            });

            const stateData = Object.entries(totalRegionPower).map(
                ([name, weight]) => ({ name, weight })
            );
            const sourceData = Object.entries(totalPowerSources).map(
                ([name, weight]) => ({ name, weight })
            );
            const applianceData = Object.entries(totalAppliances).map(
                ([name, weight]) => ({ name, weight })
            );

        if (error) {
            console.error("Error aggregating statistics:", error);
            res.status(500).json({ error: "Failed to load statistics data." });
        } else {
            res.json({
                totalEnergy: grandTotalPower,
                stateData,
                sourceData,
                applianceData,
            });
        }
    }
}
