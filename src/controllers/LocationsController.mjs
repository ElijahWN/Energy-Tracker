import path from "path";
import ApplianceTypeModel from "../models/ApplianceTypeModel.mjs";
import RegionPowerModel from "../models/RegionPowerModel.mjs";

/**
 * Controller for handling location-related requests.
 * This includes serving static pages for location list, edit, and statistics,
 * as well as providing data for appliance types and regions.
 */
export default class LocationsController {
    /**
     * Serves the static location list HTML page.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static serveListPage(req, res) {
        res.sendFile(
            path.join(
                import.meta.dirname,
                "../public/views/LocationListView.html"
            )
        );
    }

    /**
     * Serves the static location edit HTML page.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static serveEditPage(req, res) {
        res.sendFile(
            path.join(
                import.meta.dirname,
                "../public/views/LocationEditView.html"
            )
        );
    }

    /**
     * Serves the static location statistics HTML page.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static serveStatsPage(req, res) {
        res.sendFile(
            path.join(
                import.meta.dirname,
                "../public/views/LocationStatisticsView.html"
            )
        );
    }

    /**
     * Returns the list of appliance types as JSON.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static getApplianceTypes(req, res) {
        try {
            res.json(ApplianceTypeModel.types);
        } catch (error) {
            console.error("Error fetching appliance types:", error);
            res.status(500).json({ message: "Failed to fetch appliance types." });
        }
    }

    /**
     * Returns the list of regions and their power sources as JSON.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     */
    static getRegions(req, res) {
        try {
            res.json(RegionPowerModel.data);
        } catch (error) {
            console.error("Error fetching regions:", error);
            res.status(500).json({ message: "Failed to fetch regions." });
        }
    }
}
