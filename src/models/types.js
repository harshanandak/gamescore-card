// Universal data model factories for the score tracker

export function createGameTemplate({
  name,
  icon = '🎮',
  scoringType = 'cumulative',
  pointIncrement = 1,
  winCondition = { type: 'manual', target: null, mustWinBy: 0 },
  maxSets = null,
  playerMode = 'teams',
  isBuiltIn = false,
} = {}) {
  return {
    id: generateId(),
    name,
    icon,
    scoringType,       // 'cumulative' | 'sets' | 'rounds' | 'custom'
    pointIncrement,
    winCondition,      // { type: 'points'|'sets'|'rounds'|'manual', target: number|null, mustWinBy: number }
    maxSets,
    playerMode,        // 'teams' | 'players' | 'both'
    isBuiltIn,
    createdAt: new Date().toISOString(),
  };
}

export function createParticipant({ name, members = [], color = null, avatar = null } = {}) {
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  return {
    id: generateId(),
    name,
    members,
    color: color || colors[Math.floor(Math.random() * colors.length)],
    avatar: avatar || name.charAt(0).toUpperCase(),
  };
}

export function createGameSession({ templateId, templateName, templateIcon, name, participants = [] } = {}) {
  const scores = {};
  participants.forEach(p => {
    scores[p.id] = {
      total: 0,
      sets: [],
      history: [],
    };
  });

  return {
    id: generateId(),
    templateId,
    templateName: templateName || 'Custom Game',
    templateIcon: templateIcon || '🎮',
    name: name || `Game ${new Date().toLocaleDateString()}`,
    participants,
    scores,
    status: 'active',  // 'setup' | 'active' | 'paused' | 'completed'
    winner: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    notes: '',
  };
}

export function createHistoryRecord(session) {
  const finalScores = {};
  session.participants.forEach(p => {
    finalScores[p.name] = session.scores[p.id]?.total ?? 0;
  });

  return {
    id: generateId(),
    sessionId: session.id,
    templateId: session.templateId,
    templateName: session.templateName,
    templateIcon: session.templateIcon,
    gameName: session.name,
    participants: session.participants.map(p => p.name),
    participantColors: session.participants.map(p => p.color),
    winner: session.winner ? session.participants.find(p => p.id === session.winner)?.name : null,
    finalScores,
    completedAt: new Date().toISOString(),
    duration: session.startedAt
      ? Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
      : 0,
  };
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
