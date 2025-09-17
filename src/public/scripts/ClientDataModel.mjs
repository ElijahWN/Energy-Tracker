/**
 * Base class for client-side data models that interact with localStorage.
 * Provides generic methods for saving, loading, and managing data collections.
 */
export default class ClientDataModel {
    static storageKey = undefined;

    /**
     * Validates that the storage key has been set.
     * @throws {Error} If the storage key is not set.
     */
    static checkStorageKey() {
        if (!this.storageKey) {
            throw new Error("Storage Key was not set for this model.");
        }
    }

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
     * Gets all entries from localStorage, parsed and initialized.
     * @returns {any[]}
     */
    static getAll() {
        this.checkStorageKey();
        const rawData = localStorage.getItem(this.storageKey) || "[]";
        return JSON.parse(rawData).map((entry) => this.init(entry));
    }

    /**
     * Saves the provided entries array to localStorage.
     * @param {any[]} entries - The array of entries to save.
     * @returns {void}
     */
    static save(entries) {
        this.checkStorageKey();
        localStorage.setItem(this.storageKey, JSON.stringify(entries));
    }

    /**
     * Finds and returns matching entries from localStorage.
     * @param {Function} predicate - A filter function.
     * @returns {any[]} Array of matching entries.
     */
    static getMany(predicate) {
        this.validatePredicate(predicate);
        return this.getAll().filter(predicate);
    }

    /**
     * Finds and returns the first matching entry from localStorage.
     * @param {Function} predicate - A filter function.
     * @returns {any | undefined} The first matching entry, or undefined if not found.
     */
    static get(predicate) {
        this.validatePredicate(predicate);

        return this.getAll().find(predicate);
    }

    /**
     * Updates the first matching entry found in localStorage.
     * @param {Function} predicate - A filter function to find the entry.
     * @param {any} updatedEntryData - The data for the updated entry.
     * @returns {boolean} True if an entry was updated, false otherwise.
     */
    static update(predicate, updatedEntryData) {
        this.validatePredicate(predicate);
        const data = this.getAll();
        const index = data.findIndex(predicate);

        if (index !== -1) {
            data[index] = this.init(updatedEntryData);
            this.save(data);
            return true;
        }
        return false;
    }

    /**
     * Inserts a new entry into localStorage.
     * @param {any} entryData - The entry object to insert.
     * @returns {void}
     */
    static insert(entryData) {
        const data = this.getAll();
        data.push(this.init(entryData));
        this.save(data);
    }

    /**
     * Deletes entries matching the predicate from localStorage.
     * @param {Function} predicate - A filter function.
     * @returns {number} The number of deleted entries.
     */
    static delete(predicate) {
        this.validatePredicate(predicate);
        const data = this.getAll();
        const initialLength = data.length;
        const filteredData = data.filter((entry) => !predicate(entry));

        if (filteredData.length < initialLength) {
            this.save(filteredData);
        }
        return initialLength - filteredData.length;
    }
}
