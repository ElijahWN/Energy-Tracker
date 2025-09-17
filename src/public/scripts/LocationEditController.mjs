import ApplianceModel from "./ApplianceModel.mjs";
import ApplianceTypeModel from "./ApplianceTypeModel.mjs";
import LocationModel from "./LocationModel.mjs";

/**
 * Controller for the location edit page on the client-side.
 * Handles creating new locations and modifying existing ones, including managing their appliances.
 */
export default class LocationEditController {
    /**
     * @type {LocationModel}
     */
    static selectedLocation = null;
    /**
     * @type {ApplianceTypeModel[]}
     */
    static applianceTypes = [];

    static {
        LocationEditController.initialize();
    }

    static async initialize() {
        try {
            LocationEditController.applianceTypes = await ApplianceTypeModel.types;
            const urlParams = new URLSearchParams(window.location.search);
            LocationEditController.selectedLocation = LocationModel.get(
                (location) => location.publicId == urlParams.get("id")
            );

            if (!LocationEditController.selectedLocation) {
                alert("Location not found!");
                window.location.href = "/locations";
                return;
            }
            LocationEditController.populateUI();
            LocationEditController.setupEventListeners();
        } catch (error) {
            console.error("Error initializing LocationEditController:", error);
            alert(`Initialization failed: ${error.message}`);
            document.body.innerHTML =
                '<p class="text error center">Failed to initialize page. Please try again later.</p>';
        }
    }

    /** Populates the UI elements based on loaded data */
    static populateUI() {
        if (!LocationEditController.selectedLocation) return;

        const applianceSelectInput = document.getElementById("add-appliance-type");
        applianceSelectInput.innerHTML = "";

        LocationEditController.applianceTypes.forEach((type) => {
            const applianceOption = document.createElement("option");
            applianceOption.textContent = type.name;
            applianceOption.value = type.name;
            applianceSelectInput.appendChild(applianceOption);
        });

        const locationNameInput = document.getElementById("location-name");
        locationNameInput.value = LocationEditController.selectedLocation.name;

        const locationAddressInput = document.getElementById("location-address");
        locationAddressInput.value = LocationEditController.selectedLocation.address;

        const locationRegionSelect = document.getElementById("location-region");
        locationRegionSelect.value = LocationEditController.selectedLocation.region;

        const applianceList = document.getElementById("appliance-list");
        applianceList.innerHTML = "";
        LocationEditController.selectedLocation.appliances.forEach((appliance) => {
            if (appliance && appliance.type) {
                applianceList.appendChild(LocationEditController.createApplianceNode(appliance));
            } else {
                console.warn("Skipping appliance with invalid type:", appliance);
            }
        });
    }

    /** Sets up event listeners for buttons */
    static setupEventListeners() {
        const locationSaveButton = document.getElementById("save-location");
        if (locationSaveButton) {
            locationSaveButton.addEventListener(
                "click",
                LocationEditController.saveLocation
            );
        } else {
            console.error("Save button not found");
        }

        const addApplianceButton = document.getElementById("add-appliance");
        if (addApplianceButton) {
            addApplianceButton.addEventListener(
                "click",
                LocationEditController.addApppliance
            );
        } else {
            console.error("Add appliance button not found");
        }
    }

    /**
     * @param {string} name
     * @param {string} address
     * @param {string} region
     * @returns {string|undefined}
     */
    static validateLocation(name, address, region) {
        if (!/^[\w\d ]{3,}$/.test(name))
            return "Name needs to be atleast 3 characters";

        if (!/^\d+ (\w+ ?)+$/.test(address))
            return "Invalid address format (e.g. 123 Example Street)";

        if (!/^(qld|nsw|wa|tas|nt|sa|vic|act)$/i.test(region))
            return "Invalid region";
    }

    /**
     * LocationEditController will save all the edits of the location LOCALLY only.
     *
     * @returns
     */
    static saveLocation() {
        if (!LocationEditController.selectedLocation) {
            console.error("Cannot save, selected location is null.");
            alert("Error: No location selected to save.");
            return;
        }

        const locationNameInput = document.getElementById("location-name");
        const locationAddressInput = document.getElementById("location-address");
        const locationRegionInput = document.getElementById("location-region");
        if (!locationNameInput || !locationAddressInput || !locationRegionInput) {
            console.error("Could not find all location input elements");
            alert("Error: Page elements missing, cannot save.");
            return;
        }

        const validationMessage = LocationEditController.validateLocation(
            locationNameInput.value,
            locationAddressInput.value,
            locationRegionInput.value
        );

        if (validationMessage) {
            alert(validationMessage);
            return;
        }

        LocationEditController.selectedLocation.name = locationNameInput.value;
        LocationEditController.selectedLocation.address = locationAddressInput.value;
        LocationEditController.selectedLocation.region = locationRegionInput.value;

        console.log("Saving Location Locally...", LocationEditController.selectedLocation);
        LocationModel.updateLocation(LocationEditController.selectedLocation);
    }

    /**
     * Adds a new appliance
     * to the location selected for editing
     *
     * @returns
     */
    static addApppliance() {
        if (!LocationEditController.selectedLocation) return;

        const applianceTypeInput = document.getElementById("add-appliance-type");
        const applianceUsageInput = document.getElementById("add-appliance-usage");
        const applianceQuantityInput = document.getElementById(
            "add-appliance-quantity"
        );

        if (
            !applianceTypeInput ||
            !applianceUsageInput ||
            !applianceQuantityInput
        ) {
            console.error("Could not find all appliance input elements");
            alert("Error: Page elements missing, cannot add appliance.");
            return;
        }

        const validationMessage = LocationEditController.validateAppliance(
            applianceTypeInput.value,
            parseFloat(applianceUsageInput.value),
            parseInt(applianceQuantityInput.value)
        );

        if (validationMessage) {
            alert(validationMessage);
            return;
        }
        const selectedApplianceType = LocationEditController.applianceTypes.find(
            (type) => type.name == applianceTypeInput.value
        );

        if (!selectedApplianceType) {
            alert("Selected appliance type not found. Please reload.");
            return;
        }

        const newAppliance = new ApplianceModel(
            selectedApplianceType,
            parseFloat(applianceUsageInput.value),
            parseInt(applianceQuantityInput.value)
        );

        LocationEditController.selectedLocation.appliances.push(newAppliance);

        const applianceList = document.getElementById("appliance-list");
        if (applianceList) {
            applianceList.appendChild(LocationEditController.createApplianceNode(newAppliance));
        } else {
            console.error("Appliance list element not found");
        }

        applianceUsageInput.value = "0";
        applianceQuantityInput.value = "1";
    }

    /**
     *
     * @param {string} typeName - The name of the appliance type from the select input.
     * @param {number} usage
     * @param {number} quantity
     * @returns {string | undefined}
     */
    static validateAppliance(typeName, usage, quantity) {
        if (!LocationEditController.applianceTypes.find((appType) => appType.name == typeName))
            return "Appliance selected doesn't exist";

        if (!(usage >= 0)) return "Usage must be 0 or greater";

        if (!(quantity && quantity > 0))
            return "You must have at least 1 appliance";
    }

    /**
     * Deletes an appliance
     *
     * @param {ApplianceModel} appliance
     * @param {HTMLElement} applianceNode
     */
    static deleteAppliance(appliance, applianceNode) {
        if (!LocationEditController.selectedLocation) return;

        console.log("Deleting appliance:", appliance);
        applianceNode.remove();
        LocationEditController.selectedLocation.appliances = LocationEditController.selectedLocation.appliances.filter(
            (app) => app !== appliance== appliance.id
        );
        LocationModel.updateLocation(LocationEditController.selectedLocation);
    }

    /**
     * Creates the appliance element node
     *
     * @param {ApplianceModel} appliance
     * @returns {Node}
     */
    static createApplianceNode(appliance) {
        const applianceNode = document.createElement("li");
        applianceNode.classList.add("appliance", "item");

        const applianceNameLabel = document.createElement("span");
        applianceNameLabel.textContent = appliance?.type?.name || "Unknown Type";
        applianceNameLabel.title = appliance?.type?.name || "Unknown Type";
        applianceNameLabel.style.backgroundColor = "transparent";
        applianceNameLabel.style.border = "none";
        applianceNameLabel.style.textAlign = "left";
        applianceNameLabel.style.padding = "var(--spacing-xs) 0";

        const applianceQuantityLabel = document.createElement("span");
        applianceQuantityLabel.textContent = appliance.quantity;
        applianceQuantityLabel.classList.add("quantity", "label");

        const applianceHoursLabel = document.createElement("span");
        applianceHoursLabel.textContent = appliance.hours;
        applianceHoursLabel.classList.add("hours", "label");

        const applianceDeleteButton = document.createElement("button");
        applianceDeleteButton.textContent = "Delete";
        applianceDeleteButton.classList.add("button", "red");
        applianceDeleteButton.onclick = () =>
            LocationEditController.deleteAppliance(appliance, applianceNode);

        applianceNode.append(
            applianceNameLabel,
            applianceQuantityLabel,
            applianceHoursLabel,
            applianceDeleteButton
        );

        return applianceNode;
    }
}
