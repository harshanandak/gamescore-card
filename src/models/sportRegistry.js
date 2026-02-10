// Central registry for all 14 sports
// Each sport defines its engine type, scoring config, and UI settings

export const SPORT_REGISTRY = {
  // === SETS-BASED SPORTS (6) ===
  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    engine: 'sets',
    desc: 'Sets, rally scoring, deuce',
    storageKey: 'gamescore_volleyball',
    config: {
      pointsPerSet: 25,
      deciderPoints: 15,
      winBy: 2,
      setFormats: [
        { label: 'Single set', sets: 1, points: [10, 15, 21, 25] },
        { label: 'Best of 3', sets: 3 },
        { label: 'Best of 5', sets: 5 },
      ],
      defaultSetFormat: 2, // Best of 5
      serviceRotation: null, // No auto service tracking for volleyball
    },
    standingsColumns: ['P', 'W', 'L', 'SW', 'SL', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      'Rally point scoring',
      'First to 25 (15 in decider)',
      'Win by 2 at deuce',
      'Best of 3 or 5 sets',
    ],
  },

  badminton: {
    id: 'badminton',
    name: 'Badminton',
    icon: '🏸',
    engine: 'sets',
    desc: 'Rally points, best of 3',
    storageKey: 'gamescore_badminton',
    config: {
      pointsPerSet: 21,
      deciderPoints: 21,
      winBy: 2,
      maxPoints: 30, // Cap at 30
      setFormats: [
        { label: 'Single game', sets: 1, points: [11, 15, 21] },
        { label: 'Best of 3', sets: 3 },
      ],
      defaultSetFormat: 1, // Best of 3
      serviceRotation: 1, // Service changes every point
    },
    standingsColumns: ['P', 'W', 'L', 'GW', 'GL', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      'Rally point scoring',
      'Best of 3 games to 21',
      'Win by 2 (cap at 30)',
      'Auto service rotation',
    ],
  },

  tabletennis: {
    id: 'tabletennis',
    name: 'Table Tennis',
    icon: '🏓',
    engine: 'sets',
    desc: 'Best of 5/7, 11 points',
    storageKey: 'gamescore_tabletennis',
    config: {
      pointsPerSet: 11,
      deciderPoints: 11,
      winBy: 2,
      setFormats: [
        { label: 'Single game', sets: 1, points: [7, 11, 21] },
        { label: 'Best of 5', sets: 5 },
        { label: 'Best of 7', sets: 7 },
      ],
      defaultSetFormat: 1, // Best of 5
      serviceRotation: 2, // Service changes every 2 points
    },
    standingsColumns: ['P', 'W', 'L', 'GW', 'GL', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      'Best of 5 or 7 games',
      '11 points per game',
      'Win by 2 at deuce',
      'Service every 2 points',
    ],
  },

  tennis: {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    engine: 'sets',
    desc: 'Sets, games, tiebreaks',
    storageKey: 'gamescore_tennis',
    config: {
      pointsPerSet: 6, // Games to win a set
      deciderPoints: 6,
      winBy: 2,
      tiebreakAt: 6, // Tiebreak at 6-6
      tiebreakPoints: 7, // Tiebreak to 7
      setFormats: [
        { label: 'Single set', sets: 1, points: [4, 6] },
        { label: 'Best of 3', sets: 3 },
        { label: 'Best of 5', sets: 5 },
      ],
      defaultSetFormat: 1, // Best of 3
      scoringLabel: 'games', // Display "games" not "points"
      serviceRotation: null, // Manual service change in tennis
    },
    standingsColumns: ['P', 'W', 'L', 'SW', 'SL', 'GW', 'GL', '+/-', 'Pts'],
    features: [
      'Best of 3 or 5 sets',
      'Games to 6 per set',
      'Tiebreak at 6-6',
      'Singles or doubles',
    ],
  },

  pickleball: {
    id: 'pickleball',
    name: 'Pickleball',
    icon: '🏓',
    engine: 'sets',
    desc: 'Rally scoring, fastest growing',
    storageKey: 'gamescore_pickleball',
    config: {
      pointsPerSet: 11,
      deciderPoints: 11,
      winBy: 2,
      setFormats: [
        { label: 'Single game', sets: 1, points: [9, 11, 15] },
        { label: 'Best of 3', sets: 3 },
      ],
      defaultSetFormat: 1, // Best of 3
      serviceRotation: 1, // Rally scoring, service changes every point
    },
    standingsColumns: ['P', 'W', 'L', 'GW', 'GL', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      'Rally point scoring',
      'Best of 3 games to 11',
      'Win by 2 at deuce',
      'Fastest growing sport',
    ],
  },

  squash: {
    id: 'squash',
    name: 'Squash',
    icon: '🎾',
    engine: 'sets',
    desc: 'PAR scoring, best of 3/5',
    storageKey: 'gamescore_squash',
    config: {
      pointsPerSet: 11,
      deciderPoints: 11,
      winBy: 2,
      setFormats: [
        { label: 'Best of 3', sets: 3 },
        { label: 'Best of 5', sets: 5 },
      ],
      defaultSetFormat: 0, // Best of 3
      serviceRotation: null,
    },
    standingsColumns: ['P', 'W', 'L', 'GW', 'GL', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      'Point-a-rally scoring',
      'Best of 3 or 5 games',
      'Win by 2 at deuce',
      'Indoor court sport',
    ],
  },

  // === GOALS-BASED SPORTS (7) ===
  football: {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    engine: 'goals',
    desc: 'Goals, draws, goal difference',
    storageKey: 'gamescore_football',
    config: {
      scoringUnit: 'goal',
      pointIncrement: 1,
      drawAllowed: true,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      quickButtons: null, // Simple +1 goal
    },
    standingsColumns: ['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
    features: [
      '3 points for a win',
      'Draws allowed',
      'Goal difference ranking',
      'Tournament mode',
    ],
  },

  basketball: {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    engine: 'goals',
    desc: 'Points, no draws',
    storageKey: 'gamescore_basketball',
    config: {
      scoringUnit: 'point',
      pointIncrement: 1,
      drawAllowed: false,
      winPoints: 2,
      lossPoints: 0,
      quickButtons: [
        { label: '+1', value: 1 },
        { label: '+2', value: 2 },
        { label: '+3', value: 3 },
      ],
    },
    standingsColumns: ['P', 'W', 'L', 'PF', 'PA', '+/-', 'Pts'],
    features: [
      '1/2/3 point scoring',
      'No draws (OT)',
      'Point differential',
      'Quarter tracking',
    ],
  },

  hockey: {
    id: 'hockey',
    name: 'Hockey',
    icon: '🏑',
    engine: 'goals',
    desc: 'Goals, GD standings',
    storageKey: 'gamescore_hockey',
    config: {
      scoringUnit: 'goal',
      pointIncrement: 1,
      drawAllowed: true,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      quickButtons: null,
    },
    standingsColumns: ['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
    features: [
      '3 points for a win',
      'Draws allowed',
      'Goal difference ranking',
      'Field hockey rules',
    ],
  },

  handball: {
    id: 'handball',
    name: 'Handball',
    icon: '🤾',
    engine: 'goals',
    desc: 'Fast-paced goals',
    storageKey: 'gamescore_handball',
    config: {
      scoringUnit: 'goal',
      pointIncrement: 1,
      drawAllowed: true,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      quickButtons: null,
    },
    standingsColumns: ['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
    features: [
      'High-scoring matches',
      'Draws allowed',
      'Goal difference ranking',
      '2 halves format',
    ],
  },

  futsal: {
    id: 'futsal',
    name: 'Futsal',
    icon: '⚽',
    engine: 'goals',
    desc: 'Indoor football, 5v5',
    storageKey: 'gamescore_futsal',
    config: {
      scoringUnit: 'goal',
      pointIncrement: 1,
      drawAllowed: true,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      quickButtons: null,
    },
    standingsColumns: ['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'],
    features: [
      'Indoor 5v5',
      '3 points for a win',
      'Goal difference',
      'Fast-paced matches',
    ],
  },

  kabaddi: {
    id: 'kabaddi',
    name: 'Kabaddi',
    icon: '🤼',
    engine: 'goals',
    desc: 'Raids, tackles, all-out',
    storageKey: 'gamescore_kabaddi',
    config: {
      scoringUnit: 'point',
      pointIncrement: 1,
      drawAllowed: false,
      winPoints: 5,
      lossPoints: 0,
      quickButtons: [
        { label: '+1', value: 1 },
        { label: '+2 Bonus', value: 2 },
        { label: '+3 Super', value: 3 },
        { label: '+5 All Out', value: 5 },
      ],
      maxPlayers: 7, // 7 players per team on court
    },
    standingsColumns: ['P', 'W', 'L', 'SF', 'SA', 'SD', 'Pts'],
    features: [
      'Raid & tackle points',
      'Bonus points',
      'All-out bonus (2pts)',
      'Pro Kabaddi scoring',
    ],
  },

  rugby: {
    id: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    engine: 'goals',
    desc: 'Try, conversion, penalty, drop',
    storageKey: 'gamescore_rugby',
    config: {
      scoringUnit: 'point',
      pointIncrement: 1,
      drawAllowed: true,
      winPoints: 4,
      drawPoints: 2,
      lossPoints: 0,
      quickButtons: [
        { label: 'Penalty (3)', value: 3 },
        { label: 'Try (5)', value: 5 },
        { label: 'Try+Conv (7)', value: 7 },
        { label: 'Drop (3)', value: 3 },
      ],
      bonusPoints: true, // Try bonus, losing bonus
    },
    standingsColumns: ['P', 'W', 'D', 'L', 'PF', 'PA', '+/-', 'BP', 'Pts'],
    features: [
      'Try (5) + Conversion (2)',
      'Penalty goal (3)',
      'Bonus point system',
      'Drop goal (3)',
    ],
  },

  // === CUSTOM (1) ===
  cricket: {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    engine: 'custom-cricket',
    desc: 'Overs, wickets, NRR',
    storageKey: 'gamescore_cricket',
    config: {
      scoringUnit: 'run',
      pointIncrement: 1,
      drawAllowed: false,
      winPoints: 2,
      lossPoints: 0,
      quickButtons: [
        { label: '0', value: 0 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '4', value: 4 },
        { label: '6', value: 6 },
        { label: 'W', value: 0, isWicket: true },
      ],
    },
    standingsColumns: ['P', 'W', 'L', 'NR', 'NRR', 'Pts'],
    features: [
      'Custom overs (1-50)',
      'NRR points table',
      'Ball-by-ball quick match',
      'Wickets, extras, all-out',
    ],
  },
};

// Helper functions
export const getSportsList = () => Object.values(SPORT_REGISTRY);

export const getSetsSports = () => getSportsList().filter((s) => s.engine === 'sets');

export const getGoalsSports = () => getSportsList().filter((s) => s.engine === 'goals');

export const getSportById = (id) => SPORT_REGISTRY[id] || null;

export const getSportsByCategory = () => ({
  'Racquet Sports': [
    SPORT_REGISTRY.badminton,
    SPORT_REGISTRY.tabletennis,
    SPORT_REGISTRY.tennis,
    SPORT_REGISTRY.pickleball,
    SPORT_REGISTRY.squash,
  ],
  'Team Sports': [
    SPORT_REGISTRY.football,
    SPORT_REGISTRY.basketball,
    SPORT_REGISTRY.hockey,
    SPORT_REGISTRY.handball,
    SPORT_REGISTRY.futsal,
  ],
  'Contact Sports': [SPORT_REGISTRY.kabaddi, SPORT_REGISTRY.rugby],
  'Net Sports': [SPORT_REGISTRY.volleyball],
  'Bat and Ball': [SPORT_REGISTRY.cricket],
});
