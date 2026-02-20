// LocalStorage utility for persistent data
import { migrateTournaments } from './formatMigration';

const STORAGE_KEYS = {
  TOURNAMENTS: 'gamescore_tournaments',
  CRICKET_DATA: 'gamescore_cricket',
  VOLLEYBALL_DATA: 'gamescore_volleyball',
  STATISTICS: 'gamescore_statistics',
  QUICK_MATCHES: 'gamescore_quickmatches',
};

// --- Safari Private Mode Detection & Memory Fallback ---

function createMemoryFallback() {
  const store = {};
  return {
    getItem(key) {
      return key in store ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

function isStorageAvailable() {
  const testKey = '__gs_storage_test__';
  try {
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return result === 'test';
  } catch {
    return false;
  }
}

const storageAvailable = isStorageAvailable();
const memoryFallback = storageAvailable ? null : createMemoryFallback();
const isPrivateMode = !storageAvailable;

// Get the active storage backend
function getStorage() {
  return storageAvailable ? localStorage : memoryFallback;
}

// --- Quota Handling ---

/**
 * Safely saves data, catching QuotaExceededError.
 * Returns { success: true } or { success: false, error: string }
 */
function safeSave(key, data) {
  try {
    getStorage().setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    if (
      error?.name === 'QuotaExceededError' ||
      error?.code === 22 ||
      error?.code === 1014 // Firefox
    ) {
      console.warn(`[GameScore] Storage quota exceeded when saving "${key}".`);
      return { success: false, error: 'QuotaExceededError' };
    }
    console.warn(`[GameScore] Storage save failed for "${key}":`, error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

/**
 * Estimate storage usage. Returns { used, total, percentage }.
 * total is estimated at 5MB for localStorage.
 */
function getStorageUsage() {
  const ESTIMATED_TOTAL = 5 * 1024 * 1024; // 5 MB
  let used = 0;
  try {
    // For memory fallback, we can't measure usage
    if (storageAvailable) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        used += (key.length + (value ? value.length : 0)) * 2; // UTF-16
      }
    }
  } catch {
    // If we can't measure, return 0
  }
  return {
    used,
    total: ESTIMATED_TOTAL,
    percentage: ESTIMATED_TOTAL > 0 ? used / ESTIMATED_TOTAL : 0,
  };
}

/**
 * Returns true if storage usage exceeds the threshold (default 80%).
 */
function isStorageNearFull(threshold = 0.8) {
  const { percentage } = getStorageUsage();
  return percentage >= threshold;
}

// --- Generic storage functions ---

export const saveData = (key, data) => {
  const result = safeSave(key, data);
  if (!result.success) {
    console.warn(`[GameScore] Failed to save "${key}": ${result.error}`);
    return false;
  }
  return true;
};

export const loadData = (key, defaultValue = null) => {
  try {
    const data = getStorage().getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading data:', error);
    return defaultValue;
  }
};

export const clearData = (key) => {
  try {
    getStorage().removeItem(key);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Cricket-specific storage
export const saveCricketTournament = (tournamentData) => {
  const tournaments = loadData(STORAGE_KEYS.CRICKET_DATA, []);
  const existingIndex = tournaments.findIndex(t => t.id === tournamentData.id);

  if (existingIndex >= 0) {
    tournaments[existingIndex] = tournamentData;
  } else {
    tournaments.push(tournamentData);
  }

  return saveData(STORAGE_KEYS.CRICKET_DATA, tournaments);
};

export const loadCricketTournaments = () => {
  const tournaments = loadData(STORAGE_KEYS.CRICKET_DATA, []);
  const migratedTournaments = migrateTournaments(tournaments);

  // Save migrated data if needed
  const needsSave = migratedTournaments.some((t, i) =>
    t.format?.formatMode && !tournaments[i]?.format?.formatMode
  );
  if (needsSave) {
    saveData(STORAGE_KEYS.CRICKET_DATA, migratedTournaments);
  }

  return migratedTournaments;
};

export const deleteCricketTournament = (tournamentId) => {
  const tournaments = loadData(STORAGE_KEYS.CRICKET_DATA, []);
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  return saveData(STORAGE_KEYS.CRICKET_DATA, filtered);
};

// Volleyball-specific storage
export const saveVolleyballTournament = (tournamentData) => {
  const tournaments = loadData(STORAGE_KEYS.VOLLEYBALL_DATA, []);
  const existingIndex = tournaments.findIndex(t => t.id === tournamentData.id);

  if (existingIndex >= 0) {
    tournaments[existingIndex] = tournamentData;
  } else {
    tournaments.push(tournamentData);
  }

  return saveData(STORAGE_KEYS.VOLLEYBALL_DATA, tournaments);
};

export const loadVolleyballTournaments = () => {
  const tournaments = loadData(STORAGE_KEYS.VOLLEYBALL_DATA, []);
  const migratedTournaments = migrateTournaments(tournaments);

  // Save migrated data if needed
  const needsSave = migratedTournaments.some((t, i) =>
    t.format?.formatMode && !tournaments[i]?.format?.formatMode
  );
  if (needsSave) {
    saveData(STORAGE_KEYS.VOLLEYBALL_DATA, migratedTournaments);
  }

  return migratedTournaments;
};

export const deleteVolleyballTournament = (tournamentId) => {
  const tournaments = loadData(STORAGE_KEYS.VOLLEYBALL_DATA, []);
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  return saveData(STORAGE_KEYS.VOLLEYBALL_DATA, filtered);
};

// Statistics storage
export const saveStatistics = (sport, stats) => {
  const allStats = loadData(STORAGE_KEYS.STATISTICS, {});
  allStats[sport] = stats;
  return saveData(STORAGE_KEYS.STATISTICS, allStats);
};

export const loadAllStatistics = () => {
  return loadData(STORAGE_KEYS.STATISTICS, {});
};

// === GENERIC SPORT STORAGE (works with any sport via storageKey) ===
export const saveSportTournament = (storageKey, tournamentData) => {
  const tournaments = loadData(storageKey, []);
  const existingIndex = tournaments.findIndex(t => t.id === tournamentData.id);

  if (existingIndex >= 0) {
    tournaments[existingIndex] = tournamentData;
  } else {
    tournaments.push(tournamentData);
  }

  return saveData(storageKey, tournaments);
};

export const loadSportTournaments = (storageKey) => {
  const tournaments = loadData(storageKey, []);

  // Apply format migration for backward compatibility
  const migratedTournaments = migrateTournaments(tournaments);

  // If any tournament was migrated, save the updated data back
  const needsSave = migratedTournaments.some((t, i) =>
    t.format?.formatMode && !tournaments[i]?.format?.formatMode
  );

  if (needsSave) {
    saveData(storageKey, migratedTournaments);
  }

  return migratedTournaments;
};

export const deleteSportTournament = (storageKey, tournamentId) => {
  const tournaments = loadData(storageKey, []);
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  return saveData(storageKey, filtered);
};

// Quick Match storage (for test matches that navigate to a separate page)
export const saveQuickMatch = (match) => {
  const matches = loadData(STORAGE_KEYS.QUICK_MATCHES, []);
  const idx = matches.findIndex(m => m.id === match.id);
  if (idx >= 0) {
    matches[idx] = match;
  } else {
    matches.push(match);
  }
  return saveData(STORAGE_KEYS.QUICK_MATCHES, matches);
};

export const loadQuickMatches = () => {
  return loadData(STORAGE_KEYS.QUICK_MATCHES, []);
};

export const loadQuickMatch = (matchId) => {
  const matches = loadQuickMatches();
  return matches.find(m => m.id === matchId || m.id === Number(matchId)) || null;
};

export const deleteQuickMatch = (matchId) => {
  const matches = loadData(STORAGE_KEYS.QUICK_MATCHES, []);
  const filtered = matches.filter(m => m.id !== matchId);
  return saveData(STORAGE_KEYS.QUICK_MATCHES, filtered);
};

export {
  STORAGE_KEYS,
  safeSave,
  getStorageUsage,
  isStorageNearFull,
  isStorageAvailable,
  isPrivateMode,
  createMemoryFallback,
};
