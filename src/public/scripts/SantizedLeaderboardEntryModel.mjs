import ApplianceModel from "./ApplianceModel.mjs";

/**
 * Represents a sanitized leaderboard entry on the client-side.
 * Ensures that data displayed on the leaderboard is safe and appropriate.
 */
export default class SanitizedLeaderboardEntryModel {
    address = "";
    region = "";
    /**
     * @type {ApplianceModel[]}
     */
    appliances = [];
    publicId = crypto.randomUUID();

    /**
     * Constructs a SanitizedLeaderboardEntryModel instance.
     * @param {string} [address=""] - The location address.
     * @param {string} [region=""] - The location region.
     * @param {ApplianceModel[]} [appliances=[]] - List of appliances.
     * @param {string} [publicId] - Public identifier (generated if not provided).
     */
    constructor(
        address = "",
        region = "",
        appliances = [],
        publicId = crypto.randomUUID()
    ) {
        this.address = address;
        this.region = region;

        this.appliances = appliances.map((app) =>
            ApplianceModel.init ? ApplianceModel.init(app) : app
        );
        this.publicId = publicId;
    }
}
