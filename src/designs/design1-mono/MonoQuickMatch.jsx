import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OVERS_PRESETS, ballsToOvers, calculateRunRate } from '../../utils/cricketCalculations';
import { POINTS_PRESETS, validateSingleSetScore } from '../../utils/volleyballCalculations';
import { saveData, loadData } from '../../utils/storage';
import { getSportById } from '../../models/sportRegistry';
import { useTimer } from '../../hooks/useTimer';
import { getSportDefaults, applyStandardDefaults } from '../../utils/sportDefaults';

const QM_KEY = 'gamescore_quickmatches';

function saveQuickMatch(match) {
  const all = loadData(QM_KEY, []);
  all.unshift(match);
  saveData(QM_KEY, all);
}

export default function MonoQuickMatch() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const sportConfig = getSportById(sport);
  const engine = sportConfig?.engine || 'goals';
  const isCricket = engine === 'custom-cricket';
  const isGoals = engine === 'goals';

  const timer = useTimer();
  const startedAtRef = useRef(null);

  const [phase, setPhase] = useState('setup'); // setup | scoring | result
  const [visible] = useState(true);

  // Debounce ref for rapid clicks
  const lastClickRef = useRef(0);

  // Setup state
  const [formatMode, setFormatMode] = useState('standard');
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [format, setFormat] = useState(
    isCricket ? { overs: 5, players: 6, solo: true } : isGoals ? { mode: 'free' } : { type: 'single', target: 15, points: 25 }
  );
  const [showCustomOvers, setShowCustomOvers] = useState(false);
  const [customOvers, setCustomOvers] = useState('');

  // Cricket scoring state
  const [battingTeam, setBattingTeam] = useState(1);
  const [innings, setInnings] = useState(1);
  const [scores, setScores] = useState({
    team1: { runs: 0, balls: 0, wickets: 0, allOut: false },
    team2: { runs: 0, balls: 0, wickets: 0, allOut: false },
  });

  // Sets (volleyball etc.) scoring state
  const [vScore1, setVScore1] = useState(0);
  const [vScore2, setVScore2] = useState(0);

  // Best-of sets tracking
  const [sets, setSets] = useState([{ score1: 0, score2: 0, completed: false }]);
  const [currentSet, setCurrentSet] = useState(0);

  // Sets undo history
  const [vScoreHistory, setVScoreHistory] = useState([]);

  // Goals scoring state
  const [gScore1, setGScore1] = useState(0);
  const [gScore2, setGScore2] = useState(0);
  const [gScoreHistory, setGScoreHistory] = useState([]);

  // Cricket undo history
  const [cricketHistory, setCricketHistory] = useState([]);

  // Result state
  const [result, setResult] = useState(null);

  // Start timer when scoring begins
  useEffect(() => {
    if (phase === 'scoring') {
      startedAtRef.current = new Date().toISOString();
      timer.start();
    } else if (phase === 'result') {
      timer.pause();
    }
  }, [phase]);

  // Apply standard defaults when format mode is 'standard'
  useEffect(() => {
    if (formatMode === 'standard' && sport) {
      const defaults = getSportDefaults(sport);
      if (defaults && Object.keys(defaults).length > 0) {
        setFormat(applyStandardDefaults(sport, {}));
      }
    }
  }, [formatMode, sport]);

  // Goals mode helpers
  const isTimedMode = isGoals && format.mode === 'timed';
  const isPointsMode = isGoals && format.mode === 'points';
  const timeLimit = isTimedMode ? format.timeLimit : null;
  const remainingSeconds = isTimedMode ? Math.max(0, timeLimit - timer.elapsed) : null;
  const isTimeUp = isTimedMode && remainingSeconds === 0;

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalBalls = format.overs ? format.overs * 6 : Infinity;
  const maxWickets = isCricket
    ? (format.players || 6) - 1
    : 10;

  const startMatch = () => {
    if (!team1Name.trim() || !team2Name.trim()) return;
    setPhase('scoring');
  };

  // Cricket: Add runs
  const addRuns = (runs) => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    const key = battingTeam === 1 ? 'team1' : 'team2';
    setCricketHistory(prev => [...prev, { type: 'runs', key, value: runs }]);

    setScores(prev => {
      const team = { ...prev[key] };
      team.runs += runs;
      team.balls += 1;

      // Check if innings over
      if (team.balls >= totalBalls) {
        if (innings === 1) {
          setInnings(2);
          setBattingTeam(battingTeam === 1 ? 2 : 1);
          setCricketHistory([]);
        } else {
          finishCricketMatch({ ...prev, [key]: team });
        }
      }

      // Check if team 2 chased
      if (innings === 2) {
        const target = battingTeam === 2 ? prev.team1.runs : prev.team2.runs;
        if (team.runs > target) {
          finishCricketMatch({ ...prev, [key]: team });
        }
      }

      return { ...prev, [key]: team };
    });
  };

  const addWicket = () => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    const key = battingTeam === 1 ? 'team1' : 'team2';
    setCricketHistory(prev => [...prev, { type: 'wicket', key }]);

    setScores(prev => {
      const team = { ...prev[key] };
      team.wickets += 1;
      team.balls += 1;

      // All out when wickets >= players-1, or overs done
      if (team.wickets >= maxWickets || team.balls >= totalBalls) {
        team.allOut = team.wickets >= maxWickets;
        if (innings === 1) {
          setInnings(2);
          setBattingTeam(battingTeam === 1 ? 2 : 1);
          setCricketHistory([]);
        } else {
          finishCricketMatch({ ...prev, [key]: team });
        }
      }

      return { ...prev, [key]: team };
    });
  };

  const addExtra = () => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    const key = battingTeam === 1 ? 'team1' : 'team2';
    setCricketHistory(prev => [...prev, { type: 'extra', key }]);
    setScores(prev => ({
      ...prev,
      [key]: { ...prev[key], runs: prev[key].runs + 1 }, // wide/nb = +1, no ball consumed
    }));
  };

  const undoCricketAction = () => {
    if (cricketHistory.length === 0) return;
    const last = cricketHistory[cricketHistory.length - 1];
    setCricketHistory(prev => prev.slice(0, -1));

    setScores(prev => {
      const team = { ...prev[last.key] };
      if (last.type === 'runs') {
        team.runs = Math.max(0, team.runs - last.value);
        team.balls = Math.max(0, team.balls - 1);
      } else if (last.type === 'wicket') {
        team.wickets = Math.max(0, team.wickets - 1);
        team.balls = Math.max(0, team.balls - 1);
      } else if (last.type === 'extra') {
        team.runs = Math.max(0, team.runs - 1);
      }
      return { ...prev, [last.key]: team };
    });
  };

  const makeTimerFields = () => ({
    startedAt: startedAtRef.current,
    endedAt: new Date().toISOString(),
    elapsedSeconds: timer.elapsed,
  });

  const finishCricketMatch = (finalScores) => {
    const s = finalScores || scores;
    const winner = s.team1.runs > s.team2.runs ? team1Name
      : s.team2.runs > s.team1.runs ? team2Name
      : 'Tie';
    const r = {
      id: Date.now(), sport,
      team1: team1Name, team2: team2Name,
      team1Score: s.team1, team2Score: s.team2,
      winner, format,
      date: new Date().toISOString(),
      ...makeTimerFields(),
    };
    setResult(r);
    saveQuickMatch(r);
    setPhase('result');
  };

  // Volleyball: Add point
  const addPoint = (team) => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    setVScoreHistory(prev => [...prev, { team }]);

    // Best-of format (multi-set)
    if (format.type === 'best-of' && sportConfig?.config) {
      setSets(prevSets => {
        const newSets = [...prevSets];
        if (team === 1) {
          newSets[currentSet].score1++;
        } else {
          newSets[currentSet].score2++;
        }

        // Check if current set is complete
        const { deciderPoints, winBy } = sportConfig.config;
        const totalSets = format.sets || 1;
        const isDecider = totalSets > 1 && currentSet === (totalSets - 1);
        const target = isDecider && deciderPoints ? deciderPoints : (format.points || 25);
        const s1 = newSets[currentSet].score1;
        const s2 = newSets[currentSet].score2;
        const max = Math.max(s1, s2);
        const min = Math.min(s1, s2);

        if (max >= target && max - min >= winBy) {
          newSets[currentSet].completed = true;

          // Count sets won
          const t1SetsWon = newSets.filter(s => s.completed && s.score1 > s.score2).length;
          const t2SetsWon = newSets.filter(s => s.completed && s.score2 > s.score1).length;
          const setsToWin = Math.ceil((format.sets || 1) / 2);

          // Check if match complete
          if (t1SetsWon >= setsToWin || t2SetsWon >= setsToWin) {
            const winner = t1SetsWon > t2SetsWon ? team1Name : team2Name;
            const r = {
              id: Date.now(), sport,
              team1: team1Name, team2: team2Name,
              sets: newSets,
              setsWon1: t1SetsWon,
              setsWon2: t2SetsWon,
              winner, format,
              date: new Date().toISOString(),
              ...makeTimerFields(),
            };
            setResult(r);
            saveQuickMatch(r);
            setPhase('result');
          } else {
            // Start next set
            newSets.push({ score1: 0, score2: 0, completed: false });
            setCurrentSet(prev => prev + 1);
          }
        }

        return newSets;
      });
    } else {
      // Single set format
      const target = format.target;
      const updater = (prev) => prev + 1;
      if (team === 1) {
        setVScore1(updater);
      } else {
        setVScore2(updater);
      }

      const newS1 = team === 1 ? vScore1 + 1 : vScore1;
      const newS2 = team === 2 ? vScore2 + 1 : vScore2;

      if (validateSingleSetScore(newS1, newS2, target)) {
        const winner = newS1 > newS2 ? team1Name : team2Name;
        const r = {
          id: Date.now(), sport,
          team1: team1Name, team2: team2Name,
          score1: newS1, score2: newS2,
          winner, format,
          date: new Date().toISOString(),
          ...makeTimerFields(),
        };
        setResult(r);
        saveQuickMatch(r);
        setPhase('result');
      }
    }
  };

  const undoPoint = () => {
    if (vScoreHistory.length === 0) return;
    const last = vScoreHistory[vScoreHistory.length - 1];
    setVScoreHistory(prev => prev.slice(0, -1));
    if (last.team === 1) setVScore1(prev => Math.max(0, prev - 1));
    else setVScore2(prev => Math.max(0, prev - 1));
  };

  // Goals: Add score for a team
  const addGoal = (team, value = 1) => {
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    const newS1 = team === 1 ? gScore1 + value : gScore1;
    const newS2 = team === 2 ? gScore2 + value : gScore2;

    if (team === 1) setGScore1(newS1);
    else setGScore2(newS2);
    setGScoreHistory(prev => [...prev, { team, value }]);

    // Auto-end in points mode
    if (isPointsMode && format.target) {
      if (newS1 >= format.target || newS2 >= format.target) {
        const drawAllowed = sportConfig?.config?.drawAllowed ?? true;
        let winner;
        if (newS1 > newS2) winner = team1Name;
        else if (newS2 > newS1) winner = team2Name;
        else winner = drawAllowed ? 'Draw' : 'Tie';
        const r = {
          id: Date.now(), sport,
          team1: team1Name, team2: team2Name,
          score1: newS1, score2: newS2,
          winner, format,
          date: new Date().toISOString(),
          ...makeTimerFields(),
        };
        setResult(r);
        saveQuickMatch(r);
        setPhase('result');
      }
    }
  };

  const undoGoal = () => {
    if (gScoreHistory.length === 0) return;
    const last = gScoreHistory[gScoreHistory.length - 1];
    if (last.team === 1) setGScore1(prev => Math.max(0, prev - last.value));
    else setGScore2(prev => Math.max(0, prev - last.value));
    setGScoreHistory(prev => prev.slice(0, -1));
  };

  const endMatchGoals = () => {
    const drawAllowed = sportConfig?.config?.drawAllowed ?? true;
    let winner;
    if (gScore1 > gScore2) winner = team1Name;
    else if (gScore2 > gScore1) winner = team2Name;
    else winner = drawAllowed ? 'Draw' : 'Tie';
    const r = {
      id: Date.now(), sport,
      team1: team1Name, team2: team2Name,
      score1: gScore1, score2: gScore2,
      winner, format,
      date: new Date().toISOString(),
      ...makeTimerFields(),
    };
    setResult(r);
    saveQuickMatch(r);
    setPhase('result');
  };

  const endMatchManually = () => {
    if (isCricket) {
      finishCricketMatch(scores);
    } else if (isGoals) {
      endMatchGoals();
    } else {
      const winner = vScore1 > vScore2 ? team1Name
        : vScore2 > vScore1 ? team2Name
        : 'Tie';
      const r = {
        id: Date.now(), sport,
        team1: team1Name, team2: team2Name,
        score1: vScore1, score2: vScore2,
        winner, format, date: new Date().toISOString(),
        ...makeTimerFields(),
      };
      setResult(r);
      saveQuickMatch(r);
      setPhase('result');
    }
  };

  const shareResult = () => {
    if (!result) return;
    let text;
    const w = result.winner;
    const outcome = w === 'Tie' ? 'Match Tied' : w === 'Draw' ? 'Match Drawn' : `${w} won`;
    if (isCricket && result.team1Score) {
      const t1 = `${result.team1Score.runs}/${result.team1Score.wickets} (${ballsToOvers(result.team1Score.balls)} ov)`;
      const t2 = `${result.team2Score.runs}/${result.team2Score.wickets} (${ballsToOvers(result.team2Score.balls)} ov)`;
      text = `${result.team1} ${t1} vs ${result.team2} ${t2} \u2014 ${outcome}`;
    } else {
      text = `${result.team1} ${result.score1} - ${result.score2} ${result.team2} \u2014 ${outcome}`;
    }
    navigator.clipboard?.writeText(text);
  };

  // === SETUP PHASE ===
  if (phase === 'setup') {
    return (
      <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
        <div className="max-w-2xl mx-auto">
          <nav className="flex items-center gap-4 mb-10">
            <button
              onClick={() => navigate('/')}
              className="text-sm bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#888' }}
              aria-label="Go back to home"
            >
              &larr;
            </button>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#111' }}>
              {sportConfig?.icon || '\u{1F3D0}'} Quick Match
            </h1>
          </nav>

          {/* Format Mode Toggle */}
          <div className="mb-8">
            <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
              Format Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormatMode('standard')}
                className={formatMode === 'standard' ? 'mono-btn-primary' : 'mono-btn'}
                style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
              >
                Standard
              </button>
              <button
                onClick={() => setFormatMode('custom')}
                className={formatMode === 'custom' ? 'mono-btn-primary' : 'mono-btn'}
                style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
              >
                Custom
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: '#bbb' }}>
              {formatMode === 'standard'
                ? 'Official rules for this sport'
                : 'Customize all format options'}
            </p>
          </div>

          <div className="mb-6">
            <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>Teams</label>
            <input
              type="text"
              className="mono-input mb-4"
              placeholder="Team 1 name"
              value={team1Name}
              onChange={e => setTeam1Name(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="mono-input"
              placeholder="Team 2 name"
              value={team2Name}
              onChange={e => setTeam2Name(e.target.value)}
            />
          </div>

          {/* Cricket: Players per team - Only show in Custom mode */}
          {formatMode === 'custom' && isCricket && (
            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>Players per team</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFormat(prev => ({ ...prev, players: Math.max(2, (prev.players || 6) - 1) }))}
                  className="mono-btn"
                  style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 700 }}
                  disabled={format.players <= 2}
                >
                  &minus;
                </button>
                <span className="text-2xl font-bold font-mono" style={{ color: '#111', minWidth: '36px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                  {format.players || 6}
                </span>
                <button
                  onClick={() => {
                    const maxPlayers = format.solo ? 10 : 11;
                    setFormat(prev => ({ ...prev, players: Math.min(maxPlayers, (prev.players || 6) + 1) }));
                  }}
                  className="mono-btn"
                  style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 700 }}
                  disabled={format.players >= (format.solo ? 10 : 11)}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Cricket: Batting style - Only show in Custom mode */}
          {formatMode === 'custom' && isCricket && (
            <div className="mb-6">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>Batting</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat(prev => ({ ...prev, solo: true, players: Math.min(prev.players || 6, 10) }))}
                  className={format.solo ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  One side
                </button>
                <button
                  onClick={() => setFormat(prev => ({ ...prev, solo: false }))}
                  className={!format.solo ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  Both sides
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: '#bbb' }}>
                {format.solo
                  ? `One team bats, other bowls · ${(format.players || 6) - 1} wickets`
                  : `Teams bat & bowl · ${(format.players || 6) - 1} wickets`
                }
              </p>
            </div>
          )}

          {/* Cricket: Overs selection - Only show in Custom mode */}
          {formatMode === 'custom' && isCricket && (
            <div className="mb-8">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>Overs</label>
              <div className="flex gap-2 flex-wrap mb-3">
                <button
                  onClick={() => {
                    setFormat(prev => ({ ...prev, overs: null }));
                    setShowCustomOvers(false);
                    setCustomOvers('');
                  }}
                  className={!format.overs && !showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  No limit
                </button>
                {OVERS_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setFormat(prev => ({ ...prev, overs: preset.value }));
                      setShowCustomOvers(false);
                      setCustomOvers('');
                    }}
                    className={format.overs === preset.value && !showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowCustomOvers(true);
                    setCustomOvers('');
                  }}
                  className={showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  Custom
                </button>
              </div>

              {/* Custom overs input (only shown when Custom selected) */}
              {showCustomOvers && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="mono-input"
                    style={{ width: '80px', textAlign: 'center' }}
                    placeholder="1-50"
                    value={customOvers}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setCustomOvers(e.target.value);
                      if (v >= 1 && v <= 50) setFormat(prev => ({ ...prev, overs: v }));
                    }}
                    autoFocus
                  />
                  <span className="text-xs" style={{ color: '#888' }}>overs</span>
                </div>
              )}
            </div>
          )}

          {/* Sets sports: Format selection - Only show in Custom mode */}
          {formatMode === 'custom' && engine === 'sets' && sportConfig?.config?.setFormats && (
            <div className="mb-8">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>Format</label>

              {/* Format type toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setFormat(prev => ({ type: 'best-of', sets: 3, points: prev.points || 25 }))}
                  className={format.type === 'best-of' ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  Best-of
                </button>
                <button
                  onClick={() => setFormat(prev => ({ type: 'single', target: prev.target || 15, points: prev.points || 25 }))}
                  className={format.type === 'single' ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  Single set
                </button>
              </div>

              {/* Best-of sets (conditional) */}
              {format.type === 'best-of' && (
                <>
                  <div className="mt-6">
                    <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                      Sets
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {sportConfig.config.setFormats.filter(f => f.sets > 1).map((formatOption, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormat(prev => ({ ...prev, type: 'best-of', sets: formatOption.sets }))}
                          className={format.sets === formatOption.sets ? 'mono-btn-primary' : 'mono-btn'}
                          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                        >
                          {formatOption.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                      Points per set
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {POINTS_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          onClick={() => setFormat(prev => ({ ...prev, points: preset.value }))}
                          className={format.points === preset.value ? 'mono-btn-primary' : 'mono-btn'}
                          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Single set points (conditional) */}
              {format.type === 'single' && (
                <div className="mt-6">
                  <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    Points to win
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {POINTS_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setFormat(prev => ({ ...prev, type: 'single', target: preset.value }))}
                        className={format.target === preset.value ? 'mono-btn-primary' : 'mono-btn'}
                        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Goals sports: Play mode selection - Only show in Custom mode */}
          {formatMode === 'custom' && isGoals && (
            <>
              <div className="mb-6">
                <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  How are you playing?
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'free', label: 'Free play' },
                    { key: 'timed', label: 'By time' },
                    { key: 'points', label: 'By points' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setFormat({ mode: opt.key })}
                      className={format.mode === opt.key ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time presets (only when "By time" selected) */}
              {format.mode === 'timed' && (
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    Time limit
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(sportConfig?.config?.timePresets || [
                      { label: '10 min', value: 600 },
                      { label: '20 min', value: 1200 },
                      { label: '30 min', value: 1800 },
                    ]).map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setFormat({ mode: 'timed', timeLimit: opt.value })}
                        className={format.timeLimit === opt.value ? 'mono-btn-primary' : 'mono-btn'}
                        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Point presets (only when "By points" selected) */}
              {format.mode === 'points' && (
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    First to
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(sportConfig?.config?.pointPresets || [5, 10, 15, 20]).map(pts => (
                      <button
                        key={pts}
                        onClick={() => setFormat({ mode: 'points', target: pts })}
                        className={format.target === pts ? 'mono-btn-primary' : 'mono-btn'}
                        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                      >
                        {pts} {sportConfig?.config?.scoringUnit || 'point'}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={startMatch}
            className="mono-btn-primary w-full"
            style={{ padding: '12px', fontSize: '0.9375rem', opacity: team1Name.trim() && team2Name.trim() ? 1 : 0.4 }}
            disabled={!team1Name.trim() || !team2Name.trim()}
          >
            Start Match
          </button>
        </div>
      </div>
    );
  }

  // === SCORING PHASE ===
  const timerDisplay = isTimedMode
    ? formatCountdown(remainingSeconds)
    : timer.formatted;
  const timerColor = isTimeUp ? '#dc2626' : '#888';

  const quickButtons = sportConfig?.config?.quickButtons;
  const hasQuickButtons = quickButtons && quickButtons.length > 0;
  const scoringUnit = sportConfig?.config?.scoringUnit || 'point';

  if (phase === 'scoring') {
    if (isCricket) {
      const currentKey = battingTeam === 1 ? 'team1' : 'team2';
      const currentScore = scores[currentKey];
      const currentName = battingTeam === 1 ? team1Name : team2Name;
      const target = innings === 2
        ? (battingTeam === 2 ? scores.team1.runs : scores.team2.runs)
        : null;

      return (
        <div className="min-h-screen px-6 py-10">
          <div className="max-w-2xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={endMatchManually} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#dc2626' }}>
                End Match
              </button>
              <span className="text-sm font-mono" style={{ color: '#888' }}>{timer.formatted}</span>
              <span className="mono-badge mono-badge-live">
                Innings {innings}
              </span>
            </div>

            {/* Batting team */}
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#888' }}>
                {currentName} batting
              </p>
              <p className="text-6xl font-bold font-mono mono-score mb-2" style={{ color: '#111' }}>
                {currentScore.runs}<span style={{ color: '#bbb', fontSize: '0.5em' }}>/{currentScore.wickets}</span>
              </p>
              <p className="text-sm font-mono" style={{ color: '#888' }}>
                {ballsToOvers(currentScore.balls)} ov{format.overs ? ` / ${format.overs}` : ''} &middot; RR: {currentScore.balls > 0 ? calculateRunRate(currentScore.runs, currentScore.balls).toFixed(2) : '0.00'}
              </p>
              {target !== null && (
                <p className="text-sm mt-2" style={{ color: '#0066ff' }}>
                  Target: {target + 1} &middot; Need {Math.max(0, target + 1 - currentScore.runs)}{format.overs ? ` from ${totalBalls - currentScore.balls} balls` : ''}
                </p>
              )}
            </div>

            {/* Other team score */}
            <div className="mono-card text-center mb-8" style={{ padding: '12px 16px' }}>
              <p className="text-xs" style={{ color: '#888' }}>
                {battingTeam === 1 ? team2Name : team1Name}: {battingTeam === 1 ? scores.team2.runs : scores.team1.runs}/{battingTeam === 1 ? scores.team2.wickets : scores.team1.wickets}
                ({ballsToOvers(battingTeam === 1 ? scores.team2.balls : scores.team1.balls)} ov)
              </p>
            </div>

            {/* Run buttons */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button
                  key={r}
                  onClick={() => addRuns(r)}
                  className={r === 4 || r === 6 ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ width: '56px', height: '56px', fontSize: '1.25rem', fontWeight: 700, padding: 0, touchAction: 'manipulation' }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center mb-4">
              <button onClick={() => addExtra('wide')} className="mono-btn" style={{ padding: '10px 16px', fontSize: '0.8125rem', touchAction: 'manipulation' }}>
                Wide
              </button>
              <button onClick={() => addExtra('noBall')} className="mono-btn" style={{ padding: '10px 16px', fontSize: '0.8125rem', touchAction: 'manipulation' }}>
                No Ball
              </button>
            </div>

            <button
              onClick={addWicket}
              className="mono-btn w-full"
              style={{ padding: '14px', fontSize: '0.9375rem', borderColor: '#dc2626', color: '#dc2626', touchAction: 'manipulation' }}
            >
              Wicket
            </button>

            {/* Undo */}
            {cricketHistory.length > 0 && (
              <button
                onClick={undoCricketAction}
                className="mono-btn w-full mt-3"
                style={{ padding: '10px', fontSize: '0.8125rem' }}
              >
                Undo last
              </button>
            )}
          </div>
        </div>
      );
    }

    // Goals-based scoring
    if (isGoals) {
      return (
        <div className="min-h-screen px-6 py-10">
          <div className="max-w-2xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={endMatchManually} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#dc2626' }}>
                End Match
              </button>
              <span className="text-sm font-mono" style={{ color: timerColor }}>
                {isTimeUp ? "Time's up!" : timerDisplay}
              </span>
              <span className="mono-badge mono-badge-live">
                {isPointsMode ? `First to ${format.target}` : 'Live'}
              </span>
            </div>

            {/* Score panels */}
            <div className="flex items-stretch gap-4 mb-6" style={{ minHeight: hasQuickButtons ? '180px' : '250px' }}>
              {/* Team 1 */}
              <div
                className={`flex-1 flex flex-col items-center justify-center mono-card ${!hasQuickButtons ? 'cursor-pointer' : ''}`}
                onClick={!hasQuickButtons ? () => addGoal(1) : undefined}
                style={{ padding: '24px 16px', touchAction: 'manipulation' }}
              >
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#888' }}>
                  {team1Name}
                </p>
                <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                  {gScore1}
                </p>
                {!hasQuickButtons && (
                  <p className="text-xs mt-3" style={{ color: '#bbb' }}>Tap to score</p>
                )}
              </div>

              {/* Team 2 */}
              <div
                className={`flex-1 flex flex-col items-center justify-center mono-card ${!hasQuickButtons ? 'cursor-pointer' : ''}`}
                onClick={!hasQuickButtons ? () => addGoal(2) : undefined}
                style={{ padding: '24px 16px', touchAction: 'manipulation' }}
              >
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#888' }}>
                  {team2Name}
                </p>
                <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                  {gScore2}
                </p>
                {!hasQuickButtons && (
                  <p className="text-xs mt-3" style={{ color: '#bbb' }}>Tap to score</p>
                )}
              </div>
            </div>

            {/* Quick buttons per team (for button sports) */}
            {hasQuickButtons && (
              <div className="flex gap-4 mb-6">
                <div className="flex-1 flex flex-wrap gap-2 justify-center">
                  {quickButtons.map(btn => (
                    <button
                      key={`t1-${btn.label}`}
                      onClick={() => addGoal(1, btn.value)}
                      className="mono-btn"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', touchAction: 'manipulation' }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 flex flex-wrap gap-2 justify-center">
                  {quickButtons.map(btn => (
                    <button
                      key={`t2-${btn.label}`}
                      onClick={() => addGoal(2, btn.value)}
                      className="mono-btn"
                      style={{ padding: '8px 10px', fontSize: '0.75rem', touchAction: 'manipulation' }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Undo */}
            {gScoreHistory.length > 0 && (
              <button
                onClick={undoGoal}
                className="mono-btn w-full"
                style={{ padding: '10px', fontSize: '0.8125rem' }}
              >
                Undo last
              </button>
            )}

            <p className="text-xs text-center mt-4" style={{ color: '#bbb' }}>
              {!hasQuickButtons ? `Tap a team to add 1 ${scoringUnit}` : null}
              {isPointsMode && format.target ? ` · First to ${format.target}` : null}
            </p>
          </div>
        </div>
      );
    }

    // Sets scoring (volleyball, badminton, etc.)
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={endMatchManually} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#dc2626' }}>
              End Match
            </button>
            <span className="text-sm font-mono" style={{ color: '#888' }}>{timer.formatted}</span>
            <span className="mono-badge mono-badge-live">
              {format.type === 'best-of' ? `Set ${currentSet + 1} of ${format.sets || 1}` : `First to ${format.target}`}
            </span>
          </div>

          {/* Sets won (best-of only) */}
          {format.type === 'best-of' && (
            <div className="flex justify-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>{team1Name}</p>
                <p className="text-2xl font-bold font-mono" style={{ color: '#111' }}>
                  {sets.filter(s => s.completed && s.score1 > s.score2).length}
                </p>
                <p className="text-xs" style={{ color: '#bbb' }}>sets</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest" style={{ color: '#888' }}>{team2Name}</p>
                <p className="text-2xl font-bold font-mono" style={{ color: '#111' }}>
                  {sets.filter(s => s.completed && s.score2 > s.score1).length}
                </p>
                <p className="text-xs" style={{ color: '#bbb' }}>sets</p>
              </div>
            </div>
          )}

          <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '250px' }}>
            {/* Team 1 */}
            <div
              className="flex-1 flex flex-col items-center justify-center cursor-pointer mono-card"
              onClick={() => addPoint(1)}
              style={{ padding: '24px 16px', touchAction: 'manipulation' }}
            >
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
                {team1Name}
              </p>
              <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {format.type === 'best-of' ? sets[currentSet]?.score1 || 0 : vScore1}
              </p>
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>Tap to score</p>
            </div>

            {/* Team 2 */}
            <div
              className="flex-1 flex flex-col items-center justify-center cursor-pointer mono-card"
              onClick={() => addPoint(2)}
              style={{ padding: '24px 16px', touchAction: 'manipulation' }}
            >
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
                {team2Name}
              </p>
              <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {format.type === 'best-of' ? sets[currentSet]?.score2 || 0 : vScore2}
              </p>
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>Tap to score</p>
            </div>
          </div>

          {/* Undo */}
          {vScoreHistory.length > 0 && (
            <button
              onClick={undoPoint}
              className="mono-btn w-full mb-4"
              style={{ padding: '10px', fontSize: '0.8125rem' }}
            >
              Undo last
            </button>
          )}

          <p className="text-xs text-center" style={{ color: '#bbb' }}>
            {format.type === 'best-of'
              ? `${format.points || 25} points · Win by 2 at deuce`
              : `${format.target} points to win · Win by 2 at deuce`}
          </p>
        </div>
      </div>
    );
  }

  // === RESULT PHASE ===
  const isDraw = result?.winner === 'Draw';
  const isTie = result?.winner === 'Tie';
  const isNoWinner = isDraw || isTie;

  const formatElapsed = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10" style={{ paddingTop: '40px' }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
            Match Result
          </p>

          {isNoWinner ? (
            <h1 className="text-2xl font-bold" style={{ color: '#111' }}>
              {isDraw ? 'Match Drawn' : 'Match Tied'}
            </h1>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#111' }}>
                {result.winner} Won
              </h1>
              {isCricket && result.team1Score && result.team2Score && (
                <p className="text-sm" style={{ color: '#888' }}>
                  by {Math.abs(result.team1Score.runs - result.team2Score.runs)} runs
                </p>
              )}
            </>
          )}

          {result?.elapsedSeconds > 0 && (
            <p className="text-xs font-mono mt-3" style={{ color: '#888' }}>
              Duration: {formatElapsed(result.elapsedSeconds)}
            </p>
          )}
        </div>

        {/* Scorecard */}
        <div className="mono-card mb-8" style={{ padding: '20px 24px' }}>
          {isCricket && result.team1Score ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: result.winner === result.team1 ? '#111' : '#888' }}>
                  {result.team1}
                </span>
                <span className="font-mono font-bold" style={{ color: result.winner === result.team1 ? '#111' : '#888' }}>
                  {result.team1Score.runs}/{result.team1Score.wickets} ({ballsToOvers(result.team1Score.balls)} ov)
                </span>
              </div>
              <hr className="mono-divider" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: result.winner === result.team2 ? '#111' : '#888' }}>
                  {result.team2}
                </span>
                <span className="font-mono font-bold" style={{ color: result.winner === result.team2 ? '#111' : '#888' }}>
                  {result.team2Score.runs}/{result.team2Score.wickets} ({ballsToOvers(result.team2Score.balls)} ov)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: !isNoWinner && result.winner === result.team1 ? '#111' : '#888' }}>
                {result.team1}
              </span>
              <span className="text-2xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {result.score1} - {result.score2}
              </span>
              <span className="text-sm font-medium" style={{ color: !isNoWinner && result.winner === result.team2 ? '#111' : '#888' }}>
                {result.team2}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="mono-btn flex-1" style={{ padding: '12px' }}>
            Home
          </button>
          <button onClick={shareResult} className="mono-btn flex-1" style={{ padding: '12px' }}>
            Copy Result
          </button>
          <button
            onClick={() => {
              setPhase('setup');
              setScores({ team1: { runs: 0, balls: 0, wickets: 0, allOut: false }, team2: { runs: 0, balls: 0, wickets: 0, allOut: false } });
              setVScore1(0);
              setVScore2(0);
              setGScore1(0);
              setGScore2(0);
              setGScoreHistory([]);
              setVScoreHistory([]);
              setCricketHistory([]);
              setInnings(1);
              setBattingTeam(1);
              setResult(null);
              timer.reset();
              startedAtRef.current = null;
            }}
            className="mono-btn-primary flex-1"
            style={{ padding: '12px' }}
          >
            New Match
          </button>
        </div>
      </div>
    </div>
  );
}
