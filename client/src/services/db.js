import Dexie from 'dexie';

export const db = new Dexie('EchoVaultCache');

// Declare local storage schema for caching & configuration
db.version(1).stores({
  settings: 'key, value',       // Application settings (e.g. Master PIN, audio toggle)
  offlineNotes: '++id, title, content, tags, updated_at', // Notes waiting to sync
  cachedFiles: 'id, name, type, size, path, folder_name, version, content', // Cached text files
  vaultStatus: 'key, status'    // Locked state of password manager
});

export const getLocalSetting = async (key, defaultValue) => {
  try {
    const item = await db.settings.get(key);
    return item ? item.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const setLocalSetting = async (key, value) => {
  try {
    await db.settings.put({ key, value });
  } catch (e) {
    console.error('Dexie put error:', e);
  }
};
