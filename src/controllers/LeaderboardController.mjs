import express from "express";
import path from "path";
import LeaderboardItemModel from "../models/LeaderboardItemModel.mjs";
import leaderboardRoutes from "../routes/leaderboard.mjs";
import ApplianceTypeModel from "../models/ApplianceTypeModel.mjs";
import UtilsController from "../models/UtilsController.mjs";
import RegionPowerModel from "../models/RegionPowerModel.mjs";

const PAGE_SIZE = 16;

/**
 * Controller for managing the leaderboard.
 * Handles serving the leaderboard page, fetching leaderboard data,
 * and adding new entries to the leaderboard.
 */
export default class LeaderboardController {
    /**
     * Sends a standardized success or failure JSON response.
     * @param {object} res - Express response object.
     * @param {boolean} success - Indicates if the operation was successful.
     * @param {string} successMsg - Message for success response.
     * @param {string} failureMsg - Message for failure response.
     */
    static sendResponse(res, success, successMsg, failureMsg) {
        res.status(success ? 200 : 400).json({
            message: success ? successMsg : failureMsg,
        });
    }

    /**
     * Calculates the sort value for an entry based on filter and sort order.
     * @param {LeaderboardItemModel} entry - The leaderboard entry.
     * @param {string} powerSourceFilter - The selected power source filter ('ANY', 'GREEN', 'Solar', etc.).
     * @returns {object} An object containing sortValue and totalPower.
     */
    static calculateSortValues(entry, powerSourceFilter) {
        let sortValue;
        const totalPower = UtilsController.getLocationPower(entry.appliances);
        const region = RegionPowerModel.data.find(
            (r) => r.name === entry.region
        );
        const sources = region?.powerSources || {};

        if (powerSourceFilter === "GREEN") {
            const greenPercent = (
                (sources.solar || 0) +
                (sources.wind || 0) +
                (sources.hydro || 0)
            ) / 100;
            sortValue = greenPercent;
        } else if (powerSourceFilter !== "ANY") {
            sortValue = (sources[powerSourceFilter.toLowerCase()] || 0) / 100;
        } else {
            sortValue = totalPower;
        }

        return { sortValue, totalPower };
    }

    /**
     * Sorts two entries based on sort value and tie-breaker.
     * @param {object} a - First entry with sortValue and totalPower.
     * @param {object} b - Second entry with sortValue and totalPower.
     * @param {string} sortOrder - 'HIGH' or 'LOW'.
     * @param {string} powerSourceFilter - The source filter used.
     * @returns {number} Sort comparison result.
     */
    static compareEntries(a, b, sortOrder, powerSourceFilter) {
        const sortValueDiff =
            sortOrder === "HIGH"
                ? b.sortValue - a.sortValue
                : a.sortValue - b.sortValue;

        if (sortValueDiff !== 0) {
            return sortValueDiff;
        }
        if (powerSourceFilter !== "ANY") {
            return sortOrder === "HIGH"
                ? b.totalPower - a.totalPower
                : a.totalPower - b.totalPower;
        }

        return 0;
    }

    /**
     * Loads the leaderboard web page with initial server-side pagination, defaulting to GREEN energy sort.
     * @type {express.RequestHandler}
     */
    static loadLeaderboard(req, res) {
        const page = parseInt(req.query.page) || 1;
        const initialSortOrder = "HIGH";
        const initialPowerSource = "GREEN";

        const entriesWithSortValues = LeaderboardItemModel.data.map(entry => {
            const { sortValue, totalPower } = LeaderboardController.calculateSortValues(entry, initialPowerSource);
            return { ...entry, sortValue, totalPower };
        });

        entriesWithSortValues.sort((a, b) =>
            LeaderboardController.compareEntries(a, b, initialSortOrder, initialPowerSource)
        );

        const totalEntries = entriesWithSortValues.length;
        const totalPages = Math.ceil(totalEntries / PAGE_SIZE);
        const safePage = Math.max(1, Math.min(page, totalPages || 1));
        const startIndex = (safePage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const locationsForPage = entriesWithSortValues.slice(startIndex, endIndex);

        res.status(200).render("leaderboard.ejs", {
            locations: locationsForPage,
            appTypes: ApplianceTypeModel.types,
            UtilsController,
            RegionPowerModel,
            currentPage: safePage,
            totalPages: totalPages,
            pageSize: PAGE_SIZE,
        });
    }

    /**
     * API endpoint to get filtered, sorted, and paginated leaderboard entries.
     * @type {express.RequestHandler}
     */
    static getEntries(req, res) {
        let error = null;
        
            const page = parseInt(req.query.page) || 1;
            const appTypeFilter = req.query.appType || "ANY";
            const powerSourceFilter = req.query.powerSource || "GREEN";
            const regionFilter = req.query.region || "ALL";
            const sortOrder = req.query.sortOrder || "HIGH";

        let filteredEntries = [];
        
        if (LeaderboardItemModel.data) {
            filteredEntries = LeaderboardItemModel.data.filter((entry) => {
                if (regionFilter !== "ALL" && entry.region !== regionFilter) {
                    return false;
                }
                if (appTypeFilter !== "ANY") {
                    if (!entry.appliances || !Array.isArray(entry.appliances))
                        return false;
                    if (
                        !entry.appliances.some(
                            (app) => app?.type?.name === appTypeFilter
                        )
                    ) {
                        return false;
                    }
                }
                return true;
            });
        } else {
            error = new Error("LeaderboardItemModel.data is not available");
        }

        if (error) {
            console.error("Error in getEntries:", error);
            res.status(500).json({
                message: "Failed to retrieve leaderboard entries.",
            });
            return;
        }

            const entriesWithSortValue = filteredEntries.map((entry) => {
                 const { sortValue, totalPower } = LeaderboardController.calculateSortValues(entry, powerSourceFilter);
                 return { ...entry, sortValue, totalPower };
            });

            entriesWithSortValue.sort((a, b) => 
                LeaderboardController.compareEntries(a, b, sortOrder, powerSourceFilter)
            );

            const totalEntries = entriesWithSortValue.length;
            const totalPages = Math.ceil(totalEntries / PAGE_SIZE) || 1;
            const safePage = Math.max(1, Math.min(page, totalPages));
            const startIndex = (safePage - 1) * PAGE_SIZE;
            const endIndex = startIndex + PAGE_SIZE;
            const entriesForPage = entriesWithSortValue.slice(
                startIndex,
                endIndex
            );
            const sanitizedEntries = entriesForPage.map((entry) => ({
                address: entry.address,
                region: entry.region,
                appliances: entry.appliances.map((app) => ({
                    type: app.type,
                    hours: app.hours,
                    quantity: app.quantity,
                })),
                publicId: entry.publicId,
            }));
        
            res.status(200).json({
                entries: sanitizedEntries,
                currentPage: safePage,
                totalPages: totalPages,
                totalEntries: totalEntries,
            });
    }

    /**
     * Uploads a new entry to the leaderboard.
     * @type {express.RequestHandler}
     */
    static uploadNewEntry(req, res) {
        let success = true;
        let error = null;
        
        if (!req.body) {
            success = false;
            error = new Error("Missing request body");
        } else {
        try {
            LeaderboardItemModel.insert(req.body);
            } catch (err) {
                success = false;
                error = err;
            }
        }
        
        if (!success) {
            console.error("Error uploading new entry:", error);
        }
        
            LeaderboardController.sendResponse(
                res,
            success,
            "Entry uploaded successfully.",
                "Failed to upload entry."
            );
    }

    /**
     * Updates an existing leaderboard entry.
     * @type {express.RequestHandler}
     */
    static updateEntry(req, res) {
        let updated = false;
        let error = null;
        
        if (!req.body) {
            error = new Error("Missing request body");
        } else {
            try {
                updated = LeaderboardItemModel.updateLocation(req.body);
            } catch (err) {
                error = err;
            }
        }
        
        if (error) {
            console.error("Error updating entry:", error);
        }
        
            LeaderboardController.sendResponse(
                res,
                updated,
                "Entry updated successfully.",
                "Failed to update entry."
            );
    }

    /**
     * Deletes a leaderboard entry based on its private ID.
     * @type {express.RequestHandler}
     */
    static deleteEntry(req, res) {
        let deleted = 0;
        let error = null;
        
            if (!req.body || !req.body.id) {
            LeaderboardController.sendResponse(
                    res,
                    false,
                    "",
                    "Missing entry ID for deletion."
                );
            return;
            }
        
        try {
            deleted = LeaderboardItemModel.delete(
                (entry) => entry.privateId == req.body.id
            );
        } catch (err) {
            error = err;
        }
        
        if (error) {
            console.error("Error deleting entry:", error);
        }
        
            LeaderboardController.sendResponse(
                res,
                deleted > 0,
                "Entry deleted successfully.",
                "Failed to delete entry (not found?)."
            );
    }
}
