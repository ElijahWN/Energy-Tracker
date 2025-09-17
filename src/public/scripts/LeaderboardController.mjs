import ApplianceModel from "./ApplianceModel.mjs";
import LocationModel from "./LocationModel.mjs";
import RegionPowerModel from "./RegionPowerModel.mjs";
import UtilsController from "./UtilsController.mjs";
import SanitizedLeaderboardEntryModel from "./SantizedLeaderboardEntryModel.mjs";

/**
 * Controller for the leaderboard page on the client-side.
 * Fetches, displays, and manages leaderboard entries, including pagination.
 */
export default class LeaderboardController {
    static currentPageEntries = [];
    static currentPage = 1;
    static totalPages = 1;
    static totalEntries = 0;
    static currentFilters = {
        appType: "ANY",
        powerSource: "GREEN",
        region: "ALL",
        sortOrder: "HIGH" 
    };

    /**
     * Initializer: Set up listeners and fetch initial page data
     */
    static {
        this.setupEventListeners();
        this.fetchLeaderboardPage();
    }

    /**
     * Sets up event listeners for filters.
     */
    static setupEventListeners() {
        document.getElementById("app-type-filter").addEventListener("change", e=>this.handleFilterChange(e));
        document.getElementById("power-source-filter").addEventListener("change", e=>this.handleFilterChange(e));
        document.getElementById("region-filter").addEventListener("change", e=>this.handleFilterChange(e));
        document.getElementById("value-sort").addEventListener("change", e=>this.handleSortChange(e));
    }

    /**
     * Fetches a specific page of leaderboard data from the server based on current filters.
     */
    static async fetchLeaderboardPage() {
        this.currentFilters.appType = document.querySelector("select:first-of-type")?.value || "ANY";
        this.currentFilters.powerSource = document.getElementById("power-source-filter")?.value || "ANY";
        this.currentFilters.region = document.getElementById("region-filter")?.value || "ALL";

        const queryParams = new URLSearchParams({
            page: this.currentPage,
            appType: this.currentFilters.appType,
            powerSource: this.currentFilters.powerSource,
            region: this.currentFilters.region,
            sortOrder: this.currentFilters.sortOrder
        });

        try {
            const response = await fetch(`/leaderboard/entries?${queryParams}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentPageEntries = data.entries.map(entry =>
                SanitizedLeaderboardEntryModel.init
                    ? SanitizedLeaderboardEntryModel.init(entry)
                    : new SanitizedLeaderboardEntryModel(
                        entry.address, entry.region, entry.appliances, entry.publicId
                    )
            );
            this.currentPage = data.currentPage;
            this.totalPages = data.totalPages;
            this.totalEntries = data.totalEntries;
            this.render();
            
        } catch (error) {
            console.error("Error fetching leaderboard page:", error);
            const list = document.getElementById("leaderboard-list");
            if (list) list.innerHTML = `<p class="text error center">Failed to load leaderboard: ${error.message}</p>`;
            
            const paginationContainer = document.getElementById("pagination-controls");
            if (paginationContainer) paginationContainer.innerHTML = "";
        }
    }

    /**
     * Handles changes in filter dropdowns - triggers fetch.
     */
    static handleFilterChange() {
        this.currentPage = 1;
        this.fetchLeaderboardPage();
    }
    
    /**
     * Handles changes in the sort dropdown - triggers fetch.
     */
    static handleSortChange(event) {
        this.currentFilters.sortOrder = event.target.value;
        this.currentPage = 1;
        this.fetchLeaderboardPage();
    }

    /**
     * Renders the current page of the list and pagination.
     */
    static render() {
        this.renderLeaderboardList();
        this.renderPaginationControls();
    }

    /**
     * Renders the list of leaderboard entries for the current page.
     */
    static async renderLeaderboardList() {
        const leaderboardList = document.getElementById("leaderboard-list");
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = "";
        
        if (this.currentPageEntries.length === 0) {
            const noEntriesMsg = document.createElement("p");
            noEntriesMsg.classList.add("text", "center", "margin", "top", "medium");
            noEntriesMsg.textContent =
                this.totalEntries === 0
                    ? "No entries found in the leaderboard."
                    : "No entries match the current filters/page.";
            leaderboardList.appendChild(noEntriesMsg);
            return;
        }
        
        const cardPromises = this.currentPageEntries.map(entry => 
            this.createLeaderboardEntryCard(entry)
        );
        const entryElements = await Promise.all(cardPromises);
        entryElements.forEach(element => leaderboardList.appendChild(element));
    }
    
    /**
     * Renders the pagination controls based on server data.
     */
    static renderPaginationControls() {
        const paginationContainer = document.getElementById("pagination-controls");
        if (!paginationContainer) return; 

        paginationContainer.innerHTML = "";

        if (this.totalPages <= 1) {
            paginationContainer.classList.add("hidden");
            return;
        }
        
        paginationContainer.classList.remove("hidden");

        const prevButton = document.createElement("button");
        prevButton.type = "button";
        prevButton.textContent = "Previous";
        prevButton.classList.add("button");

        if (this.currentPage <= 1) {
            prevButton.classList.add("disabled");
            prevButton.disabled = true;
        } else {
            prevButton.addEventListener('click', () => this.changePage(this.currentPage - 1)); 
        }

        const pageInfo = document.createElement("span");
        pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.textContent = "Next";
        nextButton.classList.add("button");

        if (this.currentPage >= this.totalPages) {
            nextButton.classList.add("disabled");
            nextButton.disabled = true;
        } else {
            nextButton.addEventListener('click', () => this.changePage(this.currentPage + 1));
        }

        paginationContainer.append(prevButton, pageInfo, nextButton);
    }

    /**
     * Changes the current page and fetches new data.
     * @param {number} newPage - The page number to navigate to.
     */
    static changePage(newPage) {
        if (newPage < 1 || newPage > this.totalPages || newPage === this.currentPage) {
            return;
        }
        
        this.currentPage = newPage;
        this.fetchLeaderboardPage();
    }

    /**
     * Creates the leaderboard card for an entry
     * @param {SanitizedLeaderboardEntryModel} entry from the leaderboard data
     * @returns {Promise<HTMLElement>} The list item element.
     */
    static async createLeaderboardEntryCard(entry) {
        const entryItem = document.createElement("li");
        entryItem.classList.add("leaderboard", "card"); 

        const header = document.createElement("div");
        header.classList.add("leaderboard", "header");

        const address = document.createElement("h2");
        address.classList.add("leaderboard", "address");
        address.textContent = entry.address || "Address Not Provided";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.classList.add("button", "red", "small", "hidden"); 
        deleteBtn.textContent = "Delete";
        deleteBtn.id = `delete-${entry.publicId}`;
        const location = LocationModel.get(l => l.publicId === entry.publicId);
        if (location) {
            deleteBtn.classList.remove("hidden");
            deleteBtn.onclick = () => this.handleDelete(location, entryItem); 
        }

        header.append(address, deleteBtn);

        const infoRow = document.createElement("div");
        infoRow.classList.add("leaderboard", "info", "flex", "space-between", "items-center");

        const powerInfo = document.createElement("span");
        powerInfo.classList.add("leaderboard", "power", "text");
        const totalPower = await UtilsController.getLocationPower(entry.appliances);
        powerInfo.textContent = `Total Usage - ${UtilsController.powerName(totalPower)}`;

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.classList.add("button", "orange", "small"); 
        toggleBtn.textContent = "Show Stats";
        toggleBtn.id = `toggle-stats-${entry.publicId}`;
        
        infoRow.append(powerInfo, toggleBtn);
        
        const statsContent = document.createElement("div");
        statsContent.id = `view-stats-${entry.publicId}`; 
        statsContent.classList.add("stats", "hidden", "margin", "top");

        const switchDiv = document.createElement("div");
        switchDiv.classList.add("switch", "container");

        const energyBtn = document.createElement("button");
        energyBtn.type = "button";
        energyBtn.classList.add("button", "switch", "button", "selected");
        energyBtn.textContent = "Energy Source";

        const appBtn = document.createElement("button");
        appBtn.type = "button";
        appBtn.classList.add("button", "switch", "button");
        appBtn.textContent = "App Type";

        switchDiv.append(energyBtn, appBtn);

        const chartContainer = document.createElement("div");
        chartContainer.classList.add("stats", "chart", "container"); 

        const appChartDiv = document.createElement("div");
        appChartDiv.classList.add("hidden");

        const regionChartDiv = document.createElement("div");

        if (entry.appliances && entry.appliances.length > 0) {
            const appDataPromises = entry.appliances.map(async (app) => ({
                name: app?.type?.name || "Unknown",
                weight: await UtilsController.getAppliancePower(app),
            }));
            const appData = await Promise.all(appDataPromises);

            if (UtilsController.statsBarChart) {
                 appChartDiv.appendChild(UtilsController.statsBarChart(appData, undefined, undefined, true));
            } else {
                 appChartDiv.innerHTML = '<p class="text error small">Chart generation unavailable.</p>';
            }
        } else {
            appChartDiv.innerHTML = '<p class="text center muted small">No appliance data.</p>';
        }

        const regions = await RegionPowerModel.data;
        const region = regions.find((r) => r.name === entry.region);
        if (region && region.powerSources && Object.keys(region.powerSources).length > 0) {
            const regionData = Object.entries(region.powerSources).map(([name, weight]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                weight: Number(weight) || 0,
            }));
            regionChartDiv.appendChild(UtilsController.statsBarChart(regionData, undefined, 100, false));
        } else {
             regionChartDiv.innerHTML = '<p class="text center muted small">No energy source data for region.</p>';
        }

        chartContainer.append(regionChartDiv, appChartDiv);

        statsContent.append(switchDiv, chartContainer);

        toggleBtn.addEventListener('click', () => {
            statsContent.classList.toggle("hidden");
            toggleBtn.textContent = statsContent.classList.contains("hidden") ? "Show Stats" : "Hide Stats";
        });

        appBtn.addEventListener('click', () => {
            if (!appBtn.classList.contains("selected")) {
                appBtn.classList.add("selected");
                energyBtn.classList.remove("selected");
                appChartDiv.classList.remove("hidden");
                regionChartDiv.classList.add("hidden");
            }
        });

        energyBtn.addEventListener('click', () => {
             if (!energyBtn.classList.contains("selected")) {
                energyBtn.classList.add("selected");
                appBtn.classList.remove("selected");
                regionChartDiv.classList.remove("hidden");
                appChartDiv.classList.add("hidden");
            }
        });

        entryItem.append(header, infoRow, statsContent);
        return entryItem;
    }

    /**
     * Handles deletion of a location from the public leaderboard and locally.
     * Triggered by the delete button on a leaderboard entry card.
     * @param {LocationModel} location - The corresponding local location model.
     * @param {HTMLElement} entryElement - The list item element to remove.
     */
    static async handleDelete(location, entryElement) {
        if (!location || !location.privateId) {
            console.error("Invalid location data for deletion.");
            alert("Cannot delete: Missing local location data.");
            return;
        }
         
        const confirmDelete = confirm(
            `Delete "${location.name || location.address}" from the public leaderboard?\nThis cannot be undone.`
        );

        if (!confirmDelete) return;

        const deleteBtn = entryElement.getElementById(`delete-${location.publicId}`);
        if (deleteBtn) deleteBtn.disabled = true;

        try {
            const response = await fetch("/leaderboard/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: location.privateId }),
            });
        
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            location.isUploaded = false;
            const hasUpdated = LocationModel.updateLocation(location);

            if (!hasUpdated) {
                console.warn("Could not find local location to update isUploaded status after server delete.");
            }
            
            this.fetchLeaderboardPage();
        } catch (error) {
            console.error("Error during leaderboard deletion:", error);
            alert(`Error deleting from leaderboard: ${error.message}`);
            
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }
}
