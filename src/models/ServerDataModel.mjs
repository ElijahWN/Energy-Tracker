/**
 * Manages the server-side data, including locations and leaderboard entries.
 * Provides methods for loading, saving, and accessing this data.
 */
export default class ServerDataModel {
    static data = [];

    /**
     * Validates if the provided argument is a function.
     * @param {Function} predicate - The argument to validate.
     * @throws {Error} If the argument is not a function.
     */
    static validatePredicate(predicate) {
        if (typeof predicate !== "function") {
            throw new Error("Filter must be a predicate function.");
        }
    }

    /**
     * Ensures an object instance inherits from this model's prototype.
     * @param {object} entry - The object to initialize.
     * @returns {object} The initialized object linked to the prototype, or null/undefined if input is falsy.
     */
    static init(entry) {
        if (!entry) {
            return entry;
        }
        return Object.assign(Object.create(this.prototype), entry);
    }

    /**
     * Finds and returns matching entries initialized with the model's prototype.
     * @param {Function} predicate - A filter function.
     * @returns {any[]} Array of matching entries.
     */
    static getMany(predicate) {
        this.validatePredicate(predicate);
        return this.data.filter(predicate).map((entry) => this.init(entry));
    }

    /**
     * Finds and returns the first matching entry initialized with the model's prototype.
     * @param {Function} predicate - A filter function.
     * @returns {any | undefined} The first matching entry, or undefined if not found.
     */
    static get(predicate) {
        this.validatePredicate(predicate);
        const foundEntry = this.data.find(predicate);
        return this.init(foundEntry);
    }

    /**
     * Updates the first matching entry found using the predicate.
     * @param {Function} predicate - A filter function to find the entry.
     * @param {any} updatedEntryData - The data for the updated entry.
     * @returns {boolean} True if an entry was updated, false otherwise.
     */
    static update(predicate, updatedEntryData) {
        this.validatePredicate(predicate);
        const index = this.data.findIndex(predicate);

        if (index !== -1) {
            this.data[index] = this.init(updatedEntryData);
            return true;
        }
        return false;
    }

    /**
     * Inserts a new entry into the data store, initialized with the model's prototype.
     * @param {any} entryData - The entry object to insert.
     * @returns {void}
     */
    static insert(entryData) {
        this.data.push(this.init(entryData));
    }

    /**
     * Deletes entries matching the predicate.
     * @param {Function} predicate - A filter function.
     * @returns {number} The number of deleted entries.
     */
    static delete(predicate) {
        this.validatePredicate(predicate);
        const initialLength = this.data.length;
        this.data = this.data.filter((entry) => !predicate(entry));
        return initialLength - this.data.length;
    }
}
