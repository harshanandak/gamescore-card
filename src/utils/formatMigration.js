// Format migration utilities for backward compatibility
// Migrates old tournament formats to new schema with formatMode support

/**
 * Migrate a tournament's format to the new schema
 * @param {object} tournament - Tournament object to migrate
 * @returns {object} Migrated tournament
 */
export function migrateTournamentFormat(tournament) {
  if (!tournament || !tournament.format) {
    return tournament;
  }

  const format = tournament.format;

  // If formatMode already exists, no migration needed
  if (format.formatMode) {
    return tournament;
  }

  // Migrate existing tournaments to Custom mode (preserves user's original choices)
  const migratedFormat = {
    ...format,
    formatMode: 'custom',
  };

  // Apply safe defaults for missing fields based on engine type
  // These defaults ensure the tournament continues to work as expected

  // Cricket defaults
  if (format.overs !== undefined || format.players !== undefined || format.solo !== undefined) {
    if (format.players === undefined) migratedFormat.players = 6;
    if (format.solo === undefined) migratedFormat.solo = true;
    // overs can be null (no limit), so don't add default if missing
  }

  // Goals defaults
  if (format.mode !== undefined) {
    if (!format.mode) migratedFormat.mode = 'free'; // Ensure mode exists
    // timeLimit and target are optional based on mode
  }

  // Sets defaults
  if (format.type !== undefined) {
    if (format.type === 'best-of') {
      if (format.sets === undefined) migratedFormat.sets = 3;
      if (format.points === undefined) migratedFormat.points = 25;
    } else if (format.type === 'single') {
      if (format.points === undefined) migratedFormat.points = 15;
      if (format.target === undefined) migratedFormat.target = 15;
    }
  }

  return {
    ...tournament,
    format: migratedFormat,
  };
}

/**
 * Migrate an array of tournaments
 * @param {array} tournaments - Array of tournament objects
 * @returns {array} Array of migrated tournaments
 */
export function migrateTournaments(tournaments) {
  if (!Array.isArray(tournaments)) {
    return tournaments;
  }

  return tournaments.map(tournament => migrateTournamentFormat(tournament));
}

/**
 * Check if a tournament needs migration
 * @param {object} tournament - Tournament to check
 * @returns {boolean} True if migration needed
 */
export function needsMigration(tournament) {
  if (!tournament || !tournament.format) {
    return false;
  }

  // Needs migration if formatMode is missing
  return tournament.format.formatMode === undefined;
}

/**
 * Migrate Quick Match format (for Quick Match history)
 * @param {object} match - Quick Match object
 * @returns {object} Migrated match
 */
export function migrateQuickMatchFormat(match) {
  if (!match || !match.format) {
    return match;
  }

  const format = match.format;

  // If formatMode already exists, no migration needed
  if (format.formatMode) {
    return match;
  }

  // Migrate to custom mode (preserves original behavior)
  const migratedFormat = {
    ...format,
    formatMode: 'custom',
  };

  return {
    ...match,
    format: migratedFormat,
  };
}

/**
 * Migrate an array of Quick Matches
 * @param {array} matches - Array of Quick Match objects
 * @returns {array} Array of migrated matches
 */
export function migrateQuickMatches(matches) {
  if (!Array.isArray(matches)) {
    return matches;
  }

  return matches.map(match => migrateQuickMatchFormat(match));
}
