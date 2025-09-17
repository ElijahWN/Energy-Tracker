/**
 * Represents the power generation sources for a specific region on the server-side.
 * Contains a static list of predefined regional power source data.
 */
export default class RegionPowerModel {
    name = "";
    powerSources = {};

    /**
     * A static list containing predefined regional power source data.
     * @type {RegionPowerModel[]}
     */
    static data = [
        {
            name: "NSW",
            powerSources: { wind: 12, solar: 15, gas: 25, coal: 48 },
        },
        {
            name: "VIC",
            powerSources: { wind: 20, solar: 22, gas: 30, coal: 28 },
        },
        {
            name: "QLD",
            powerSources: { wind: 10, solar: 20, gas: 25, coal: 45 },
        },
        {
            name: "WA",
            powerSources: { wind: 15, solar: 20, gas: 35, coal: 30 },
        },
        {
            name: "SA",
            powerSources: { wind: 40, solar: 30, gas: 20, coal: 10 },
        },
        {
            name: "TAS",
            powerSources: { wind: 60, solar: 20, gas: 10, coal: 10 },
        },
        {
            name: "ACT",
            powerSources: { wind: 30, solar: 40, gas: 20, coal: 10 },
        },
        {
            name: "NT",
            powerSources: { wind: 20, solar: 30, gas: 40, coal: 10 },
        },
    ].map((region) => new RegionPowerModel(region.name, region.powerSources));

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
