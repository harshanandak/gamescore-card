import {
  createGameTemplate,
  createParticipant,
  createGameSession,
  generateId,
} from './types';

// ─── generateId ────────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });
});

// ─── createGameTemplate ────────────────────────────────────────────────────────

describe('createGameTemplate', () => {
  it('returns object with correct shape and defaults', () => {
    const template = createGameTemplate({ name: 'Test Game' });

    expect(template).toHaveProperty('id');
    expect(template.name).toBe('Test Game');
    expect(template.icon).toBe('🎮');
    expect(template.scoringType).toBe('cumulative');
    expect(template.pointIncrement).toBe(1);
    expect(template.winCondition).toEqual({ type: 'manual', target: null, mustWinBy: 0 });
    expect(template.maxSets).toBeNull();
    expect(template.playerMode).toBe('teams');
    expect(template.isBuiltIn).toBe(false);
    expect(template.createdAt).toBeDefined();
  });

  it('uses provided values', () => {
    const template = createGameTemplate({
      name: 'Volleyball',
      icon: '🏐',
      scoringType: 'sets',
      pointIncrement: 1,
      winCondition: { type: 'sets', target: 3, mustWinBy: 0 },
      maxSets: 5,
      playerMode: 'teams',
      isBuiltIn: true,
    });

    expect(template.name).toBe('Volleyball');
    expect(template.icon).toBe('🏐');
    expect(template.scoringType).toBe('sets');
    expect(template.maxSets).toBe(5);
    expect(template.isBuiltIn).toBe(true);
  });

  it('has a unique id', () => {
    const t1 = createGameTemplate({ name: 'A' });
    const t2 = createGameTemplate({ name: 'B' });
    expect(t1.id).not.toBe(t2.id);
  });

  it('has a valid ISO date for createdAt', () => {
    const template = createGameTemplate({ name: 'Test' });
    const date = new Date(template.createdAt);
    expect(date.toISOString()).toBe(template.createdAt);
  });

  it('works with no arguments', () => {
    const template = createGameTemplate();
    expect(template).toHaveProperty('id');
    expect(template.name).toBeUndefined();
    expect(template.icon).toBe('🎮');
  });
});

// ─── createParticipant ─────────────────────────────────────────────────────────

describe('createParticipant', () => {
  it('returns object with correct shape', () => {
    const p = createParticipant({ name: 'Player 1' });

    expect(p).toHaveProperty('id');
    expect(p.name).toBe('Player 1');
    expect(p.members).toEqual([]);
    expect(p.color).toBeDefined();
    expect(typeof p.color).toBe('string');
    expect(p.avatar).toBe('P');
  });

  it('avatar is first character uppercase', () => {
    expect(createParticipant({ name: 'alice' }).avatar).toBe('A');
    expect(createParticipant({ name: 'Bob' }).avatar).toBe('B');
  });

  it('uses provided color', () => {
    const p = createParticipant({ name: 'Test', color: '#ff0000' });
    expect(p.color).toBe('#ff0000');
  });

  it('uses provided avatar', () => {
    const p = createParticipant({ name: 'Test', avatar: '🏐' });
    expect(p.avatar).toBe('🏐');
  });

  it('uses provided members', () => {
    const p = createParticipant({ name: 'Team A', members: ['Alice', 'Bob'] });
    expect(p.members).toEqual(['Alice', 'Bob']);
  });

  it('assigns a random color from the palette when none provided', () => {
    const validColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    const p = createParticipant({ name: 'Test' });
    expect(validColors).toContain(p.color);
  });

  it('generates unique ids', () => {
    const p1 = createParticipant({ name: 'A' });
    const p2 = createParticipant({ name: 'B' });
    expect(p1.id).not.toBe(p2.id);
  });
});

// ─── createGameSession ─────────────────────────────────────────────────────────

describe('createGameSession', () => {
  it('returns object with correct shape', () => {
    const session = createGameSession({
      templateId: 'tmpl1',
      templateName: 'Volleyball',
      templateIcon: '🏐',
      name: 'Finals',
      participants: [],
    });

    expect(session).toHaveProperty('id');
    expect(session.templateId).toBe('tmpl1');
    expect(session.templateName).toBe('Volleyball');
    expect(session.templateIcon).toBe('🏐');
    expect(session.name).toBe('Finals');
    expect(session.participants).toEqual([]);
    expect(session.scores).toEqual({});
    expect(session.status).toBe('active');
    expect(session.winner).toBeNull();
    expect(session.startedAt).toBeDefined();
    expect(session.completedAt).toBeNull();
    expect(session.notes).toBe('');
  });

  it('initializes scores for each participant', () => {
    const participants = [
      { id: 'p1', name: 'Team A' },
      { id: 'p2', name: 'Team B' },
    ];

    const session = createGameSession({
      templateId: 'tmpl1',
      name: 'Game',
      participants,
    });

    expect(session.scores.p1).toEqual({ total: 0, sets: [], history: [] });
    expect(session.scores.p2).toEqual({ total: 0, sets: [], history: [] });
  });

  it('uses default templateName when not provided', () => {
    const session = createGameSession({});
    expect(session.templateName).toBe('Custom Game');
  });

  it('uses default templateIcon when not provided', () => {
    const session = createGameSession({});
    expect(session.templateIcon).toBe('🎮');
  });

  it('generates a default name with date when not provided', () => {
    const session = createGameSession({});
    expect(session.name).toContain('Game');
  });

  it('generates unique ids', () => {
    const s1 = createGameSession({ name: 'A' });
    const s2 = createGameSession({ name: 'B' });
    expect(s1.id).not.toBe(s2.id);
  });

  it('has a valid ISO date for startedAt', () => {
    const session = createGameSession({ name: 'Test' });
    const date = new Date(session.startedAt);
    expect(date.toISOString()).toBe(session.startedAt);
  });
});
