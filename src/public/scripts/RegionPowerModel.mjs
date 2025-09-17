/**
 * Represents the power generation sources for a specific region on the client-side.
 * It fetches region power data from the server.
 */
export default class RegionPowerModel {
    name = "";
    powerSources = {};

    /**
     * A static list containing predefined regional power source data.
     * This data is fetched from the server.
     * @type {Promise<RegionPowerModel[]>}
     */
    static data = fetch("/locations/regions").then(response => response.json()).then(data => {
        return data.map(region => new RegionPowerModel(region.name, region.powerSources));
    });

    /**
     * Constructs a RegionPowerModel instance.
     * @param {string} [name=""] - The name of the region (e.g., state/territory).
     * @param {object} [powerSources={}] - An object mapping power source names to their percentage contribution.
     */
    constructor(name = "", powerSources = {}) {
        this.name = name;
        this.powerSources = powerSources;
    }
}
