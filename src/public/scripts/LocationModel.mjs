import ApplianceModel from "./ApplianceModel.mjs";
import ClientDataModel from "./ClientDataModel.mjs";
import ApplianceTypeModel from "./ApplianceTypeModel.mjs";

/**
 * Represents a location on the client-side, including its address, region, and appliances.
 * It provides methods for managing appliances and calculating total energy usage.
 */
export default class LocationModel extends ClientDataModel {
    static storageKey = "locations";

    name = "";
    address = "";
    region = "";
    appliances = [];
    publicId = crypto.randomUUID();
    privateId = crypto.randomUUID();
    isUploaded = false;

    /**
     * Constructs a LocationModel instance.
     * @param {string} [name=""] - The name identifier for the location.
     * @param {string} [address=""] - The location address.
     * @param {string} [region=""] - The location region.
     * @param {ApplianceModel[]} [appliances=[]] - List of appliances.
     * @param {string} [publicId] - Public identifier (generated if not provided).
     * @param {string} [privateId] - Private identifier (generated if not provided).
     * @param {boolean} [isUploaded=false] - Upload status flag.
     */
    constructor(
        name = "",
        address = "",
        region = "",
        appliances = [],
        publicId = crypto.randomUUID(),
        privateId = crypto.randomUUID(),
        isUploaded = false
    ) {
        super();
        this.name = name;
        this.address = address;
        this.region = region;
        this.appliances = appliances.map((app) =>
            ApplianceModel.init ? ApplianceModel.init(app) : app
        );
        this.publicId = publicId;
        this.privateId = privateId;
        this.isUploaded = isUploaded;
    }

    /**
     * Updates a location entry in localStorage based on its private ID.
     * @param {LocationModel} newLocationData - The updated location data.
     * @returns {boolean} True if the update was successful, false otherwise.
     */
    static updateLocation(newLocationData) {
        const initializedData = this.init(newLocationData);
        return this.update(
            (location) => location.privateId === initializedData.privateId,
            initializedData
        );
    }

    /**
     * Deletes a location entry from localStorage by its private ID.
     * @param {string} privateId - The private ID of the location to delete.
     * @returns {number} The number of entries deleted (0 or 1).
     */
    static deleteById(privateId) {
        return this.delete((location) => location.privateId === privateId);
    }
}
