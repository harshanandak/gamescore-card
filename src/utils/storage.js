// LocalStorage utility for persistent data

const STORAGE_KEYS = {
  TOURNAMENTS: 'gamescore_tournaments',
  CRICKET_DATA: 'gamescore_cricket',
  VOLLEYBALL_DATA: 'gamescore_volleyball',
  STATISTICS: 'gamescore_statistics'
};

// Generic storage functions
export const saveData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const loadData = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading data:', error);
    return defaultValue;
  }
};

export const clearData = (key) => {
  try {
    localStorage.removeItem(key);
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
  return loadData(STORAGE_KEYS.CRICKET_DATA, []);
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
  return loadData(STORAGE_KEYS.VOLLEYBALL_DATA, []);
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
  return loadData(storageKey, []);
};

export const deleteSportTournament = (storageKey, tournamentId) => {
  const tournaments = loadData(storageKey, []);
  const filtered = tournaments.filter(t => t.id !== tournamentId);
  return saveData(storageKey, filtered);
};

export { STORAGE_KEYS };
