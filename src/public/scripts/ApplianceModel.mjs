import ApplianceTypeModel from "./ApplianceTypeModel.mjs";

/**
 * Represents an appliance instance on the client-side.
 * Stores the appliance type, hours used, and quantity, mirroring the server-side model.
 */
export default class ApplianceModel {
    type = null;
    hours = 0;
    quantity = 1;

    /**
     * Ensures an object instance inherits from this model's prototype
     * and that the 'type' property is an ApplianceTypeModel instance.
     * @param {object} entry - The object to initialize.
     * @returns {ApplianceModel | null | undefined} The initialized object or original input.
     */
    static init(entry) {
        if (!entry) {
            return entry;
        }
        const initialized = Object.assign(Object.create(this.prototype), entry);

        if (
            initialized.type &&
            !(initialized.type instanceof ApplianceTypeModel)
        ) {
            initialized.type = new ApplianceTypeModel(
                initialized.type.name,
                initialized.type.watts
            );
        }
        return initialized;
    }

    /**
     * Constructs an ApplianceModel instance.
     * @param {ApplianceTypeModel | object | null} [type=null] - The type of the appliance (instance or plain object).
     * @param {number} [hours=0] - The average daily hours of use.
     * @param {number} [quantity=1] - The number of this appliance.
     */
    constructor(type = null, hours = 0, quantity = 1) {
        if (type && !(type instanceof ApplianceTypeModel)) {
            this.type = new ApplianceTypeModel(type.name, type.watts);
        } else {
            this.type = type;
        }
        this.hours = Number(hours) || 0;
        this.quantity = Number(quantity) || 1;
    }
}
