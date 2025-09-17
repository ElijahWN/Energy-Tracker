import LocationModel from "./LocationModel.mjs";
import UtilsController from "./UtilsController.mjs";

/**
 * Controller for the location list page on the client-side.
 * Manages the display and interaction of the list of saved locations.
 */
export default class LocationListController {
    static searchTimeout = null;

    /**
     * Initializes event listeners and loads the initial location list.
     */
    static {
        this.setupEventListeners();
        this.renderLocationList(LocationModel.getAll());
    }

    /**
     * Sets up event listeners for the page.
     */
    static setupEventListeners() {
        document
            .getElementById("create-location-button")
            .addEventListener("click", this.handleCreateLocation.bind(this));

        document
            .getElementById("search-location")
            .addEventListener("input", this.handleSearchInput.bind(this));
    }

    /**
     * Handles the creation of a new location entry.
     */
    static handleCreateLocation() {
        const locationInput = document.getElementById("create-location-input");
        const locationName = locationInput.value.trim();

        if (!locationName) {
            alert("Please enter a name for the location.");
            return;
        }

        const newLocation = new LocationModel(locationName);
        LocationModel.insert(newLocation);

        window.location.href = `/locations/edit?id=${newLocation.publicId}`;
    }

    /**
     * Handles search input with debouncing.
     * @param {InputEvent} event - The input event object.
     */
    static handleSearchInput(event) {
        clearTimeout(this.searchTimeout);
        const searchTerm = event.target.value.toLowerCase().trim();

        this.searchTimeout = setTimeout(() => {
            const allLocations = LocationModel.getAll();
            const filteredLocations = allLocations.filter((location) =>
                location.name.toLowerCase().includes(searchTerm)
            );
            this.renderLocationList(filteredLocations);
        }, 300);
    }

    /**
     * Posts or updates a location to the server leaderboard.
     * If updating (PUT) fails, it tries posting (POST) before alerting failure.
     * @param {LocationModel} location - The location to post/update.
     * @param {HTMLButtonElement} postButton - The button triggering the action.
     */
    static handlePost(location, postButton) {
        postButton.disabled = true;
        const isUpdate = location.isUploaded;
        postButton.textContent = isUpdate ? "Updating..." : "Posting...";

        const fetchOptions = {
            method: isUpdate ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: location.name,
                    address: location.address,
                    region: location.region,
                    appliances: location.appliances,
                    publicId: location.publicId,
                    privateId: location.privateId,
                }),
        };

        fetch("/leaderboard/upload", fetchOptions)
            .then(response => {
            if (response.ok) {
                    return response.json();
                } else {
                    if (isUpdate) {
                        console.warn("PUT failed, attempting POST for:", location.publicId);
                        const postOptions = { ...fetchOptions, method: "POST" };
                        return fetch("/leaderboard/upload", postOptions)
                            .then(postResponse => {
                                if (!postResponse.ok) {
                                     return postResponse.json()
                                        .catch(() => ({ message: `HTTP error! Status: ${postResponse.status}` }))
                                        .then(errorData => {
                                             throw new Error(errorData.message || `Failed to POST after PUT failed`);
                                        });
                                }
                                return postResponse.json();
                            });
                    } else {
                        return response.json()
                            .catch(() => ({ message: `HTTP error! Status: ${response.status}` }))
                            .then(errorData => {
                                throw new Error(errorData.message || `Failed to POST location`);
                            });
                    }
                }
            })
            .then(responseData => {
                console.log("Post/Update successful:", responseData.message);
                location.isUploaded = true;
                LocationModel.updateLocation(location);
                postButton.textContent = "Posted";
            })
            .catch(error => {
                console.error("Error during post/update:", error);
                alert(`Error: ${error.message}`);
                postButton.textContent = isUpdate ? "Update Failed" : "Post Failed";
            })
            .finally(() => {
            postButton.disabled = false;
            });
    }

    /**
     * Handles the deletion of a location entry locally and potentially on the server.
     * @param {LocationModel} location - The location to delete.
     * @param {HTMLElement} locationCardElement - The card element in the DOM.
     */
    static handleDelete(location, locationCardElement) {
        const confirmDelete = confirm(
            `Are you sure you want to delete "${location.name}"?`
        );
        if (!confirmDelete) {
            return;
        }
        try {
            LocationModel.deleteById(location.privateId);
            locationCardElement.remove();
        } catch (localError) {
            console.error("Error deleting location locally:", localError);
            alert(`Failed to delete location locally: ${localError.message}`);
            return;
        }
        if (location.isUploaded) {
            fetch("/leaderboard/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: location.privateId }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json()
                        .catch(() => ({ message: `HTTP error! Status: ${response.status}` }))
                        .then(errorData => {
                             throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                        });
                }
                console.log("Server deletion successful");
            })
            .catch(serverError => {
                console.error("Error deleting location from server:", serverError);
                alert(`Failed to delete from leaderboard: ${serverError.message}\nIt has been deleted locally.`);
            });
        }
    }

    /**
     * Renders the list of location cards into the container.
     * @param {LocationModel[]} locations - Array of locations to render.
     */
    static async renderLocationList(locations) {
        const locationsContainer = document.getElementById(
            "locations-container"
        );
        if (!locationsContainer) return;
        locationsContainer.innerHTML = "";

        if (locations.length === 0) {
            locationsContainer.innerHTML =
                '<p class="text center pad all large">No locations found.</p>';
            return;
        }

        const cardPromises = locations.map(location => 
            this.createLocationCard(location)
        );

        const locationCards = await Promise.all(cardPromises);
        locationCards.forEach(card => locationsContainer.appendChild(card));
    }

    /**
     * Creates the HTML element for a single location card.
     * @param {LocationModel} location - The location data model.
     * @returns {Promise<HTMLElement>} The created location card element.
     */
    static async createLocationCard(location) {
        const totalPower = await UtilsController.getLocationPower(
            location.appliances
        );
        const totalAppliances = location.appliances.reduce(
            (sum, app) => sum + (Number(app.quantity) || 0),
            0
        );

        const locationCard = document.createElement("div");
        locationCard.classList.add("card", "location");

        const header = document.createElement("div");
        header.classList.add("location", "title");
        const name = document.createElement("h2");
        name.textContent = location.name;
        const powerBadge = document.createElement("span");
        powerBadge.classList.add("badge", "yellow");
        powerBadge.textContent = UtilsController.powerName(totalPower);
        header.append(name, powerBadge);

        const info = document.createElement("div");
        info.classList.add("location", "stats");
        const statsBtn = document.createElement("a");
        statsBtn.classList.add("button", "blue", "small");
        statsBtn.href = `/locations/statistics?id=${location.publicId}`;
        statsBtn.textContent = "View Stats";
        const quantityBadge = document.createElement("span");
        quantityBadge.classList.add(
            "badge",
            "orange",
            "flex",
            "grow",
            "center"
        );
        quantityBadge.textContent = `x${totalAppliances} Appliances`;
        info.append(statsBtn, quantityBadge);

        const controls = document.createElement("div");
        controls.classList.add("location", "actions");

        const postBtn = document.createElement("button");
        postBtn.classList.add("button", "green", "small");
        postBtn.textContent = location.isUploaded ? "Update Post" : "Post";
        postBtn.onclick = () => this.handlePost(location, postBtn);

        const editLink = document.createElement("a");
        editLink.classList.add("button", "grey", "small");
        editLink.textContent = "Edit";
        editLink.href = `/locations/edit?id=${location.publicId}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("button", "red", "small");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => this.handleDelete(location, locationCard);

        controls.append(postBtn, editLink, deleteBtn);

        locationCard.append(header, info, controls);

        return locationCard;
    }
}
