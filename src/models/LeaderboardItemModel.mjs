import ApplianceModel from "./ApplianceModel.mjs";
import ServerDataModel from "./ServerDataModel.mjs";
import ApplianceTypeModel from "./ApplianceTypeModel.mjs";

/**
 * Represents an item on the leaderboard on the server-side.
 * Stores user's name, score (total kWh), and location details.
 */
export default class LeaderboardItemModel extends ServerDataModel {
    address = "";
    region = "";
    appliances = [];
    publicId = crypto.randomUUID();
    privateId = crypto.randomUUID();

    /**
     * Constructs a LeaderboardItemModel instance.
     * @param {string} [address=""] - The location address.
     * @param {string} [region=""] - The location region.
     * @param {ApplianceModel[]} [appliances=[]] - List of appliances.
     * @param {string} [publicId] - Public identifier (generated if not provided).
     * @param {string} [privateId] - Private identifier (generated if not provided).
     */
    constructor(
        address = "",
        region = "",
        appliances = [],
        publicId = crypto.randomUUID(),
        privateId = crypto.randomUUID()
    ) {
        super();
        this.address = address;
        this.region = region;
        this.appliances = appliances.map((app) =>
            ApplianceModel.init ? ApplianceModel.init(app) : app
        );
        this.publicId = publicId;
        this.privateId = privateId;
    }

    /**
     * Updates a location entry based on its private ID.
     * @param {LeaderboardItemModel} newLocationData - The updated location data.
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
     * Deletes a location entry by its private ID.
     * @param {string} privateId - The private ID of the location to delete.
     * @returns {number} The number of entries deleted (0 or 1).
     */
    static deleteById(privateId) {
        return this.delete((location) => location.privateId === privateId);
    }
}
