import ApplianceTypeModel from "./ApplianceTypeModel.mjs";
import LocationModel from "./LocationModel.mjs";
import RegionPowerModel from "./RegionPowerModel.mjs";
import UtilsController from "./UtilsController.mjs";

/**
 * Controller for the location-specific statistics page on the client-side.
 * Fetches and displays energy consumption statistics for a particular location.
 */
export default class LocationStatisticsController {
    static totalPowerUsage = 0;
    /**
     * @type {LocationModel | null}
     */
    static selectedLocation = null;

    static async initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get("id");
        if (!locationId) {
            console.error("No location ID found in URL.");
            document.getElementById("location-name").textContent = "Error: Location ID missing";
            document.getElementById("stats-container").innerHTML = "<p class='text error center'>Could not load statistics because location ID is missing.</p>";
            return;
        }

        this.selectedLocation = LocationModel.get(
            (location) => location.publicId == locationId
        );

        if (!this.selectedLocation) {
            console.error(`Location with ID ${locationId} not found.`);
            document.getElementById("location-name").textContent = "Error: Location not found";
            document.getElementById("stats-container").innerHTML = "<p class='text error center'>Could not load statistics because the location was not found.</p>";
            return;
        }

        const locationTitle = document.getElementById("location-name");
        locationTitle.textContent = this.selectedLocation.name;

        this.totalPowerUsage = await UtilsController.getLocationPower(
            this.selectedLocation.appliances
        );

        const locationPowerUsage = document.getElementById("location-power");
        locationPowerUsage.textContent = `Total Usage - ${UtilsController.powerName(
            this.totalPowerUsage
        )}`;
        const regions = await RegionPowerModel.data;
        const region = regions.find(
            (r) => r.name == this.selectedLocation.region
        );

        const statsContainer = document.getElementById("stats-container");
        statsContainer.innerHTML = "";

        const powerSourcesData = Object.entries(region?.powerSources || {}).map(
            ([name, weight]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                weight: weight,
            })
        );
        const powerSourcesChart = UtilsController.statsBarChart(
            powerSourcesData,
            "Regional Power Sources (% Power Supply)",
            100,
            false
        );
        const appliancePromises = this.selectedLocation.appliances.map(async (app) => ({
            name: app.type.name,
            weight: await UtilsController.getAppliancePower(app),
        }));
        const appliancesData = await Promise.all(appliancePromises);

        const appliancesChart = UtilsController.statsBarChart(
            appliancesData,
            "Appliance Usage (Daily Watt Hours)",
            undefined,
            true
        );

        statsContainer.append(powerSourcesChart, appliancesChart);
    }
    static {
        LocationStatisticsController.initializePage().catch(error => {
            console.error("Failed to initialize LocationStatisticsController:", error);
            const statsContainer = document.getElementById("stats-container");
            if (statsContainer) {
                statsContainer.innerHTML = "<p class='text error center'>An unexpected error occurred while loading statistics.</p>";
            } else {
                document.body.innerHTML = "<p class='text error center'>An unexpected error occurred. Please try again later.</p>";
            }
            const locationTitle = document.getElementById("location-name");
            if (locationTitle) locationTitle.textContent = "Error";
        });
    }
}
