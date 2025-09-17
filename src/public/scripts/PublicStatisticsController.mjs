import RegionPowerModel from "./RegionPowerModel.mjs";
import SanitizedLeaderboardEntryModel from "./SantizedLeaderboardEntryModel.mjs";
import UtilsController from "./UtilsController.mjs";

/**
 * Controller for the public statistics page on the client-side.
 * Fetches and displays overall energy consumption statistics.
 */
export default class PublicStatisticsController {
    /**
     * Initializes the controller when the script loads.
     */
    static {
        this.initialize();
    }

    /**
     * Fetches statistics data from the server.
     * @returns {Promise<object>} A promise that resolves with the statistics data.
     */
    static async fetchStatsData() {
        const response = await fetch("/statistics/data");
        if (!response.ok) {
            const errorBody = await response.text().catch(() => `HTTP error! status: ${response.status}`);
            throw new Error(`Failed to fetch stats: ${errorBody}`);
        }
        return await response.json();
    }

    /**
     * Renders a message indicating that no data is available.
     * @param {HTMLElement} statsContainer - The container to append the message to.
     */
    static renderNoDataMessage(statsContainer) {
        const totalEnergyElement = statsContainer.querySelector(".total.energy.card");
        statsContainer.innerHTML = '';
        if (totalEnergyElement) {
            statsContainer.appendChild(totalEnergyElement);
        }

        const energyUsageSpan = document.getElementById("energy-usage");
        if (energyUsageSpan) {
            energyUsageSpan.textContent = UtilsController.powerName(0);
        }

        const warn = document.createElement("p");
        warn.classList.add("text", "center", "margin", "top", "large");
        warn.textContent = "No data available. Try uploading a location.";

        statsContainer.appendChild(warn);
    }

    /**
     * Renders the statistics charts based on the fetched data.
     * @param {HTMLElement} statsContainer - The container to append charts to.
     * @param {object} statsData - The statistics data from the server.
     */
    static renderStatsCharts(statsContainer, statsData) {
        const totalEnergyElement = statsContainer.querySelector(".total.energy.card");
        statsContainer.innerHTML = '';
        if (totalEnergyElement) {
            statsContainer.appendChild(totalEnergyElement);
        }


        const energyUsageSpan = document.getElementById("energy-usage");
        if (energyUsageSpan) {
            energyUsageSpan.textContent = UtilsController.powerName(
                statsData.totalEnergy
            );
        }

        const stateData = statsData.stateData.map((item) => ({
            ...item,
            prefix: UtilsController.powerName(item.weight),
        }));
        const stateChart = UtilsController.statsPieChart(
            stateData,
            "State/Territory Usage"
        );

        const sourceData = statsData.sourceData.map((item) => ({
            name: item.name,
            weight: item.weight,
            prefix: UtilsController.powerName(item.weight),
        }));
        const sourceChart = UtilsController.statsPieChart(
            sourceData,
            "Energy Source Usage"
        );

        const applianceData = statsData.applianceData.map((item) => ({
            name: item.name,
            weight: item.weight,
            prefix: UtilsController.powerName(item.weight),
        }));
        const applianceChart = UtilsController.statsPieChart(
            applianceData,
            "Appliance Usage",
            6
        );
        statsContainer.append(
            stateChart,
            sourceChart,
            applianceChart
        );
    }

    /**
     * Handles errors during the fetch or rendering process.
     * @param {Error} error - The error object.
     */
    static handleError(error) {
        console.error("Error fetching or processing statistics:", error);
        const statsContainer = document.body.children[1];

        if (statsContainer) {
            const totalEnergyElement = statsContainer.querySelector(".total.energy.card");
            statsContainer.innerHTML = '';
            if (totalEnergyElement) {
                 statsContainer.appendChild(totalEnergyElement);
                 const energyUsageSpan = document.getElementById("energy-usage");
                 if (energyUsageSpan) {
                     energyUsageSpan.textContent = "Error";
                 }
            }

            const warn = document.createElement("p");
            warn.textContent = `Failed to load statistics: ${error.message}. Please try again later.`;
            warn.classList.add(
                "text",
                "center",
                "margin",
                "top",
                "large",
                "error"
            );
            statsContainer.appendChild(warn);
        } else {
            alert(`Failed to load statistics: ${error.message}`);
        }
    }

    /**
     * Initializes the public statistics page by fetching data
     * and rendering the necessary DOM elements.
     */
    static async initialize() {
        const statsContainer = document.body.children[1];
        if (!statsContainer) {
            console.error("Statistics container not found in DOM.");
            alert("Error: Statistics container missing.");
            return;
        }
        const energyUsageSpan = document.getElementById("energy-usage");
        if (energyUsageSpan) {
            energyUsageSpan.textContent = "Loading...";
        }

        try {
            const statsData = await this.fetchStatsData();
            if (!statsData || statsData.totalEnergy === 0) {
                this.renderNoDataMessage(statsContainer);
            } else {
                this.renderStatsCharts(statsContainer, statsData);
            }
        } catch (error) {
            this.handleError(error);
        }
    }
}
