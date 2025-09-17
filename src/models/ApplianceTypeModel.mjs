/**
 * Represents an appliance type on the server-side.
 * Contains a static list of predefined appliance types with their names and wattages.
 */
export default class ApplianceTypeModel {
    name = "";
    watts = 0;

    /**
     * A static list containing predefined appliance types.
     * @type {ApplianceTypeModel[]}
     */
    static types = [
        { name: "Refrigerator", watts: 100 },
        { name: "Air Conditioner", watts: 350 },
        { name: "Heater", watts: 1500 },
        { name: "Washing Machine", watts: 500 },
        { name: "Dryer", watts: 3000 },
        { name: "Dishwasher", watts: 1800 },
        { name: "Oven", watts: 2150 },
        { name: "Microwave", watts: 1000 },
        { name: "Toaster", watts: 800 },
        { name: "Coffee Maker", watts: 900 },
        { name: "Television", watts: 150 },
        { name: "Computer", watts: 200 },
        { name: "Lamp", watts: 60 },
    ].map((app) => new ApplianceTypeModel(app.name, app.watts));

    /**
     * Constructs an ApplianceTypeModel instance.
     * @param {string} [name=""] - The name of the appliance type.
     * @param {number} [watts=0] - The power consumption in watts.
     */
    constructor(name = "", watts = 0) {
        this.name = name;
        this.watts = watts;
    }
}
