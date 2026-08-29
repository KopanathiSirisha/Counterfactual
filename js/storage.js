'use strict';

(function(global) {
  let db = null;
  const DB_NAME = 'CounterfactualDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'photos';
  const ENTRIES_KEY = 'cf-entries';

  /**
   * Data storage module handling localStorage and IndexedDB.
   * @namespace Storage
   */
  const Storage = {
    /**
     * Initialize IndexedDB
     * @returns {Promise<void>} Resolves when DB is ready
     */
    init: function() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const database = event.target.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          db = event.target.result;
          resolve();
        };

        request.onerror = (event) => {
          console.error('IndexedDB init error:', event.target.error);
          reject(event.target.error);
        };
      });
    },

    /**
     * Get entry metadata from localStorage
     * @returns {Array} Array of entry objects
     */
    getEntries: function() {
      try {
        const data = localStorage.getItem(ENTRIES_KEY);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing entries from localStorage:', e);
        return [];
      }
    },

    /**
     * Save entry metadata to localStorage
     * @param {Array} entries Array of entry objects
     */
    saveEntries: function(entries) {
      try {
        localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
      } catch (e) {
        console.error('Error saving entries to localStorage (quota exceeded?):', e);
      }
    },

    /**
     * Save a photo to IndexedDB
     * @param {string} id Photo UUID
     * @param {string} dataUrl Base64 data URL
     * @returns {Promise<void>}
     */
    savePhoto: function(id, dataUrl) {
      return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database not initialized'));
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: id, data: dataUrl });

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
      });
    },

    /**
     * Get a photo from IndexedDB
     * @param {string} id Photo UUID
     * @returns {Promise<string|null>} Base64 data URL or null
     */
    getPhoto: function(id) {
      return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database not initialized'));
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = (e) => {
          const result = e.target.result;
          resolve(result ? result.data : null);
        };
        request.onerror = (e) => reject(e.target.error);
      });
    },

    /**
     * Delete a photo from IndexedDB
     * @param {string} id Photo UUID
     * @returns {Promise<void>}
     */
    deletePhoto: function(id) {
      return new Promise((resolve, reject) => {
        if (!db) return reject(new Error('Database not initialized'));
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
      });
    },

    /**
     * Export all data for backup
     * @returns {Promise<object>} Exported data
     */
    exportData: async function() {
      const entries = this.getEntries();
      const photos = {};
      
      if (db) {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.getAll();
          
          request.onsuccess = (e) => {
            const results = e.target.result || [];
            results.forEach(photo => {
              photos[photo.id] = photo.data;
            });
            resolve();
          };
          request.onerror = (e) => reject(e.target.error);
        });
      }
      
      return { entries, photos };
    },

    /**
     * Import data from backup
     * @param {object} data Exported data object
     * @returns {Promise<void>}
     */
    importData: async function(data) {
      if (!data || !Array.isArray(data.entries)) throw new Error('Invalid export data');
      this.saveEntries(data.entries);
      
      if (data.photos && db) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        await Promise.all(Object.keys(data.photos).map(id => {
          return new Promise((resolve, reject) => {
            const request = store.put({ id: id, data: data.photos[id] });
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
          });
        }));
      }
    }
  };

  global.Storage = Storage;
})(window);
