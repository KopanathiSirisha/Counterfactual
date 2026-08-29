'use strict';

(function(global) {
  let entriesCache = [];
  
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadEntries() {
    if (global.Storage) {
      entriesCache = global.Storage.getEntries();
    }
  }

  function saveEntries() {
    if (global.Storage) {
      global.Storage.saveEntries(entriesCache);
    }
  }

  function validate(data) {
    const required = ['date', 'wanted', 'did', 'status', 'tag', 'intensity'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Business logic and CRUD operations for entries.
   * @namespace Entries
   */
  const Entries = {
    /**
     * Get all entries sorted by date ascending
     * @returns {Array} Array of entry objects
     */
    getAll: function() {
      loadEntries();
      return deepCopy(entriesCache).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    /**
     * Get single entry by ID
     * @param {string} id 
     * @returns {Object|null}
     */
    getById: function(id) {
      loadEntries();
      const entry = entriesCache.find(e => e.id === id);
      return entry ? deepCopy(entry) : null;
    },

    /**
     * Create a new entry
     * @param {Object} data 
     * @returns {Object}
     */
    create: function(data) {
      validate(data);
      loadEntries();
      
      const now = new Date().toISOString();
      const newEntry = {
        id: crypto.randomUUID(),
        date: data.date,
        wanted: data.wanted,
        did: data.did,
        status: data.status,
        tag: data.tag,
        intensity: Number(data.intensity),
        photoId: data.photoId || null,
        createdAt: now,
        updatedAt: now
      };
      
      entriesCache.push(newEntry);
      saveEntries();
      
      document.dispatchEvent(new CustomEvent('entry-created', { detail: { entry: deepCopy(newEntry) } }));
      return deepCopy(newEntry);
    },

    /**
     * Update an existing entry
     * @param {string} id 
     * @param {Object} data 
     * @returns {Object|null}
     */
    update: function(id, data) {
      loadEntries();
      const index = entriesCache.findIndex(e => e.id === id);
      if (index === -1) return null;
      
      const entry = entriesCache[index];
      const updatedEntry = {
        ...entry,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      entriesCache[index] = updatedEntry;
      saveEntries();
      
      document.dispatchEvent(new CustomEvent('entry-updated', { detail: { entry: deepCopy(updatedEntry) } }));
      return deepCopy(updatedEntry);
    },

    /**
     * Delete an entry by ID
     * @param {string} id 
     * @returns {boolean}
     */
    delete: function(id) {
      loadEntries();
      const index = entriesCache.findIndex(e => e.id === id);
      if (index === -1) return false;
      
      const entry = entriesCache[index];
      entriesCache.splice(index, 1);
      saveEntries();
      
      if (entry.photoId && global.Storage) {
        global.Storage.deletePhoto(entry.photoId).catch(err => {
          console.error('Failed to delete associated photo', err);
        });
      }
      
      document.dispatchEvent(new CustomEvent('entry-deleted', { detail: { id } }));
      return true;
    },

    /**
     * Get entries filtered by date range
     * @param {string} startDate YYYY-MM-DD
     * @param {string} endDate YYYY-MM-DD
     * @returns {Array}
     */
    getByDateRange: function(startDate, endDate) {
      return this.getAll().filter(e => e.date >= startDate && e.date <= endDate);
    },

    /**
     * Get entries filtered by tag
     * @param {string} tag 
     * @returns {Array}
     */
    getByTag: function(tag) {
      return this.getAll().filter(e => e.tag === tag);
    },

    /**
     * Get entries filtered by status
     * @param {string} status 
     * @returns {Array}
     */
    getByStatus: function(status) {
      return this.getAll().filter(e => e.status === status);
    },

    /**
     * Check if an entry exists for a given date
     * @param {string} date YYYY-MM-DD
     * @returns {boolean}
     */
    hasEntryForDate: function(date) {
      loadEntries();
      return entriesCache.some(e => e.date === date);
    }
  };

  // Initialize cache
  loadEntries();
  global.Entries = Entries;
})(window);
