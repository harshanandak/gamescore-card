// Standard format defaults for all 14 sports
// Based on 2026 real-world tournament practices and international standards

export const SPORT_DEFAULTS = {
  // === SETS-BASED SPORTS ===
  volleyball: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 3, // Best-of-3 (common in recreational play)
    points: 25,
    customization: {
      pointCap: 27, // Real-world standard
      winBy: 2,
    },
  },

  badminton: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 3, // Best-of-3 games
    points: 21,
    customization: {
      pointCap: 30, // BWF rules
      winBy: 2,
    },
  },

  tabletennis: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 5, // Best-of-5 games
    points: 11,
    customization: {
      winBy: 2,
    },
  },

  tennis: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 3, // Best-of-3 sets
    points: 6, // Games per set
    customization: {
      tiebreakAt: 6, // Tiebreak at 6-6
      tiebreakPoints: 7,
      winBy: 2,
    },
  },

  pickleball: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 3, // Best-of-3 games
    points: 11,
    customization: {
      winBy: 2,
    },
  },

  squash: {
    formatMode: 'standard',
    type: 'best-of',
    sets: 3, // Best-of-3 games (PAR scoring)
    points: 11,
    customization: {
      winBy: 2,
    },
  },

  // === GOALS-BASED SPORTS ===
  football: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 5400, // 90 minutes (2×45 halves)
  },

  basketball: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 2880, // 48 minutes (4×12 quarters, NBA)
  },

  hockey: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 3600, // 60 minutes (4×15 quarters or 2×30 halves)
  },

  handball: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 3600, // 60 minutes (2×30 halves)
  },

  futsal: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 2400, // 40 minutes (2×20 halves)
  },

  rugby: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 4800, // 80 minutes (2×40 halves)
  },

  kabaddi: {
    formatMode: 'standard',
    mode: 'timed',
    timeLimit: 2400, // 40 minutes (2×20 halves)
  },

  // === CUSTOM CRICKET ===
  cricket: {
    formatMode: 'standard',
    overs: 20, // T20 format
    players: 11,
    solo: false, // Both sides bat (standard)
  },
};

/**
 * Get standard format defaults for a sport
 * @param {string} sportId - Sport identifier from sportRegistry
 * @returns {object} Standard format defaults
 */
export function getSportDefaults(sportId) {
  return SPORT_DEFAULTS[sportId] || {};
}

/**
 * Apply standard defaults to a format object
 * Used when user selects "Standard" mode
 * @param {string} sportId - Sport identifier
 * @param {object} existingFormat - Current format (optional)
 * @returns {object} Format with standard defaults applied
 */
export function applyStandardDefaults(sportId, existingFormat = {}) {
  const defaults = getSportDefaults(sportId);

  return {
    ...defaults,
    ...existingFormat,
    formatMode: 'standard', // Ensure mode is set
  };
}

/**
 * Check if a format is using standard settings
 * @param {string} sportId - Sport identifier
 * @param {object} format - Format to check
 * @returns {boolean} True if format matches standard
 */
export function isStandardFormat(sportId, format) {
  const defaults = getSportDefaults(sportId);

  // Check engine-specific fields
  if (defaults.type && format.type !== defaults.type) return false;
  if (defaults.sets && format.sets !== defaults.sets) return false;
  if (defaults.points && format.points !== defaults.points) return false;
  if (defaults.mode && format.mode !== defaults.mode) return false;
  if (defaults.timeLimit && format.timeLimit !== defaults.timeLimit) return false;
  if (defaults.overs !== undefined && format.overs !== defaults.overs) return false;
  if (defaults.players && format.players !== defaults.players) return false;
  if (defaults.solo !== undefined && format.solo !== defaults.solo) return false;

  return true;
}
