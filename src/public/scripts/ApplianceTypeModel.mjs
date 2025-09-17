/**
 * Represents an appliance type on the client-side, including its name and power consumption (watts).
 * It fetches appliance type data from the server.
 */
export default class ApplianceTypeModel {
    name = "";
    watts = 0;

    /** 
     * A promise that resolves to an array of ApplianceTypeModel instances.
     * Fetches appliance types from the server upon first access.
     * @type {Promise<ApplianceTypeModel[]>}
     */
    static types = fetch('/locations/appliances')
        .then(response => response.json())
        .then(data => data.map(typeData => new ApplianceTypeModel(typeData.name, typeData.watts)))
        .catch(error => {
            console.error("Failed to load appliance types:", error);
            return [];
        });

    constructor(name = "", watts = 0) {
        this.name = name;
        this.watts = watts;
    }
}
