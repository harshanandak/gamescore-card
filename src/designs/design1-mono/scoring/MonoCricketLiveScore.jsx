import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadCricketTournaments, saveCricketTournament } from '../../../utils/storage';
import { ballsToOvers, calculateRunRate } from '../../../utils/cricketCalculations';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Haptic feedback helper
const triggerHaptic = (pattern) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Confetti helper
const triggerConfetti = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const overlay = document.createElement('div');
  overlay.className = 'mono-confetti-overlay';
  document.body.appendChild(overlay);

  const colors = ['#0066ff', '#00cc88', '#ff6b6b', '#ffd93d', '#a569bd'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'mono-confetti mono-confetti-animate';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random()}s`;
    overlay.appendChild(confetti);
  }

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 3500);
};

export default function MonoCricketLiveScore() {
  const navigate = useNavigate();
  const { id, matchId } = useParams();

  // Core state
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);

  // Scoring state
  const [battingTeam, setBattingTeam] = useState(1); // 1 or 2
  const [innings, setInnings] = useState(1); // 1 or 2
  const [scores, setScores] = useState({
    team1: { runs: 0, balls: 0, wickets: 0, allOut: false },
    team2: { runs: 0, balls: 0, wickets: 0, allOut: false },
  });
  const [history, setHistory] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounce ref for rapid clicks
  const lastClickRef = useRef(0);

  // Load tournament and match
  useEffect(() => {
    const tournaments = loadCricketTournaments();
    const found = tournaments.find(t => t.id === Number(id));
    if (!found) return;

    const foundMatch = found.matches.find(m => m.id === matchId);
    if (!foundMatch) return;

    setTournament(found);
    setMatch(foundMatch);

    // Initialize from existing score if editing
    if (foundMatch.team1Score && !foundMatch.draftState) {
      setScores({
        team1: { ...foundMatch.team1Score, wickets: foundMatch.team1Score.wickets || 0 },
        team2: { ...foundMatch.team2Score, wickets: foundMatch.team2Score.wickets || 0 },
      });
      // If both innings played, set to innings 2
      if (foundMatch.team2Score && foundMatch.team2Score.balls > 0) {
        setInnings(2);
        setBattingTeam(2);
      }
    }

    // Restore from draft if exists
    if (foundMatch.draftState) {
      setScores(foundMatch.draftState.scores);
      setBattingTeam(foundMatch.draftState.battingTeam);
      setInnings(foundMatch.draftState.innings);
      setHistory(foundMatch.draftState.history || []);
    }
  }, [id, matchId]);

  const totalBalls = tournament?.format?.overs ? tournament.format.overs * 6 : 12;
  const maxWickets = (tournament?.format?.players || 11) - 1;

  // Add runs
  const addRuns = (runs) => {
    if (!tournament) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Haptic feedback: stronger pulse for 4s and 6s
    if (runs === 4 || runs === 6) {
      triggerHaptic([50, 50, 50]); // Triple pulse for boundary
    } else {
      triggerHaptic(50); // Single pulse for normal runs
    }

    // Save to history
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      scores: JSON.parse(JSON.stringify(scores)),
      battingTeam,
      innings,
    }].slice(-100));

    setHasChanges(true);

    const key = `team${battingTeam}`;
    setScores(prev => {
      const team = { ...prev[key] };
      team.runs += runs;
      team.balls += 1;

      // Check if innings over (balls exhausted)
      if (team.balls >= totalBalls) {
        team.allOut = false;
        if (innings === 1) {
          // Switch to innings 2
          setTimeout(() => {
            setInnings(2);
            setBattingTeam(battingTeam === 1 ? 2 : 1);
          }, 100);
        }
      }

      // Check if team 2 chased the target
      if (innings === 2) {
        const target = battingTeam === 2 ? prev.team1.runs : prev.team2.runs;
        if (team.runs > target) {
          // Team 2 wins by chase - don't switch innings, just complete
        }
      }

      return { ...prev, [key]: team };
    });
  };

  // Add wicket
  const addWicket = () => {
    if (!tournament) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Haptic feedback: double pulse for wicket
    triggerHaptic([80, 80, 80]);

    // Save to history
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      scores: JSON.parse(JSON.stringify(scores)),
      battingTeam,
      innings,
    }].slice(-100));

    setHasChanges(true);

    const key = `team${battingTeam}`;
    setScores(prev => {
      const team = { ...prev[key] };
      team.wickets += 1;
      team.balls += 1;

      // Check if all out (10 wickets)
      if (team.wickets >= maxWickets) {
        team.allOut = true;
        if (innings === 1) {
          // Switch to innings 2
          setTimeout(() => {
            setInnings(2);
            setBattingTeam(battingTeam === 1 ? 2 : 1);
          }, 100);
        }
      } else if (team.balls >= totalBalls) {
        // Balls exhausted
        team.allOut = false;
        if (innings === 1) {
          setTimeout(() => {
            setInnings(2);
            setBattingTeam(battingTeam === 1 ? 2 : 1);
          }, 100);
        }
      }

      return { ...prev, [key]: team };
    });
  };

  // Add extra (wide/no-ball)
  const addExtra = (type) => {
    if (!tournament) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Haptic feedback: short pulse for extra
    triggerHaptic(30);

    // Save to history
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      scores: JSON.parse(JSON.stringify(scores)),
      battingTeam,
      innings,
    }].slice(-100));

    setHasChanges(true);

    const key = `team${battingTeam}`;
    setScores(prev => {
      const team = { ...prev[key] };
      team.runs += 1; // Wide/No-ball adds 1 run
      // Wide/No-ball doesn't count as a ball

      return { ...prev, [key]: team };
    });
  };

  // Undo
  const undo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setScores(last.scores);
    setBattingTeam(last.battingTeam);
    setInnings(last.innings);
    setHistory(prev => prev.slice(0, -1));
  };

  // Save draft (in-progress match)
  const saveDraft = () => {
    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            status: 'in-progress',
            draftState: {
              scores: JSON.parse(JSON.stringify(scores)),
              battingTeam,
              innings,
              history: JSON.parse(JSON.stringify(history.slice(-50))),
              savedAt: new Date().toISOString(),
            },
          }
        : m
    );

    saveCricketTournament({
      ...tournament,
      matches: updatedMatches,
    });

    setHasChanges(false);
    alert('Draft saved! You can resume this match later.');
    navigate(`/cricket/tournament/${id}`);
  };

  // Keyboard shortcuts (skip on touch-only devices)
  useEffect(() => {
    if (!tournament) return;
    if (isTouchDevice) return;

    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ignore if match is complete
      if (isMatchComplete) return;

      const key = e.key.toLowerCase();

      // Run buttons (0-6)
      if (['0', '1', '2', '3', '4', '6'].includes(key)) {
        addRuns(parseInt(key));
      }
      // Wicket
      else if (key === 'w') {
        addWicket();
      }
      // Extra (wide/no-ball)
      else if (key === 'e') {
        addExtra('wide');
      }
      // Undo
      else if (key === 'u') {
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scores, battingTeam, innings, history, tournament, isMatchComplete]); // Dependencies

  // Save match
  const saveMatch = () => {
    if (!tournament || !match) return;

    // Trigger celebration for completed match
    if (scores.team1.balls > 0 || scores.team2.balls > 0) {
      triggerConfetti();
      triggerHaptic([100, 100, 100, 100, 100]); // Victory pattern
    }

    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            team1Score: {
              runs: scores.team1.runs,
              balls: scores.team1.balls,
              wickets: scores.team1.wickets,
              allOut: scores.team1.allOut,
            },
            team2Score: {
              runs: scores.team2.runs,
              balls: scores.team2.balls,
              wickets: scores.team2.wickets,
              allOut: scores.team2.allOut,
            },
            status: 'completed',
            draftState: undefined, // Clear draft state
          }
        : m
    );

    saveCricketTournament({
      ...tournament,
      matches: updatedMatches,
    });

    // Delay navigation slightly to show confetti
    setTimeout(() => {
      navigate(`/cricket/tournament/${id}`);
    }, 300);
  };

  // Cancel
  const handleCancel = () => {
    if (hasChanges && !window.confirm('Discard unsaved changes?')) return;
    navigate(`/cricket/tournament/${id}`);
  };

  if (!tournament || !match) {
    return <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <p style={{ color: '#888' }}>Loading...</p>
    </div>;
  }

  const getTeamName = (teamId) => {
    return tournament.teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  const team1Name = getTeamName(match.team1Id);
  const team2Name = getTeamName(match.team2Id);
  const currentKey = `team${battingTeam}`;
  const currentScore = scores[currentKey];
  const currentName = battingTeam === 1 ? team1Name : team2Name;
  const otherName = battingTeam === 1 ? team2Name : team1Name;
  const otherScore = battingTeam === 1 ? scores.team2 : scores.team1;

  const target = innings === 2
    ? (battingTeam === 2 ? scores.team1.runs : scores.team2.runs)
    : null;

  // Check if innings/match should be complete
  const isInningsComplete = currentScore.balls >= totalBalls || currentScore.wickets >= maxWickets;
  const isMatchComplete = innings === 2 && (isInningsComplete || (target !== null && currentScore.runs > target));

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleCancel}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            ← Back
          </button>
          <span className={`mono-badge ${isMatchComplete ? 'mono-badge-final' : 'mono-badge-live'}`}>
            Innings {innings}
          </span>
        </div>

        {/* Batting team score */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#888' }}>
            {currentName} batting
          </p>
          <p className="text-6xl font-bold font-mono mono-score mb-2" style={{ color: '#111' }}>
            {currentScore.runs}
            <span style={{ color: '#bbb', fontSize: '0.5em' }}>/{currentScore.wickets}</span>
          </p>
          <p className="text-sm font-mono mb-1" style={{ color: '#888' }}>
            {ballsToOvers(currentScore.balls)} overs ({totalBalls / 6} max)
          </p>
          <p className="text-sm font-mono" style={{ color: '#888' }}>
            Run Rate: {currentScore.balls > 0 ? calculateRunRate(currentScore.runs, currentScore.balls).toFixed(2) : '0.00'}
          </p>
          {target !== null && (
            <p className="text-sm mt-2" style={{ color: '#0066ff' }}>
              Target: {target + 1} · Need {Math.max(0, target + 1 - currentScore.runs)} from {totalBalls - currentScore.balls} balls
            </p>
          )}
          {!isTouchDevice && (
            <p className="text-xs mt-3" style={{ color: '#ccc' }}>
              Keyboard: 0-6 = Runs &middot; W = Wicket &middot; E = Extra &middot; U = Undo
            </p>
          )}
        </div>

        {/* Other team score */}
        <div className="mono-card text-center mb-8" style={{ padding: '12px 16px' }}>
          <p className="text-xs" style={{ color: '#888' }}>
            {otherName}: {otherScore.runs}/{otherScore.wickets} ({ballsToOvers(otherScore.balls)} ov)
          </p>
        </div>

        {/* Scoring controls */}
        {!isMatchComplete && (
          <>
            {/* Run buttons */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button
                  key={r}
                  onClick={() => addRuns(r)}
                  disabled={isInningsComplete}
                  className={r === 4 || r === 6 ? 'mono-btn-primary' : 'mono-btn'}
                  style={{
                    width: '56px',
                    height: '56px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    padding: 0,
                    opacity: isInningsComplete ? 0.5 : 1,
                    touchAction: 'manipulation',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Extras */}
            <div className="flex gap-2 justify-center mb-4">
              <button
                onClick={() => addExtra('wide')}
                disabled={isInningsComplete}
                className="mono-btn"
                style={{
                  padding: '10px 16px',
                  fontSize: '0.8125rem',
                  opacity: isInningsComplete ? 0.5 : 1,
                  touchAction: 'manipulation',
                }}
              >
                Wide
              </button>
              <button
                onClick={() => addExtra('noBall')}
                disabled={isInningsComplete}
                className="mono-btn"
                style={{
                  padding: '10px 16px',
                  fontSize: '0.8125rem',
                  opacity: isInningsComplete ? 0.5 : 1,
                  touchAction: 'manipulation',
                }}
              >
                No Ball
              </button>
            </div>

            {/* Wicket button */}
            <button
              onClick={addWicket}
              disabled={isInningsComplete}
              className="mono-btn w-full mb-4"
              style={{
                padding: '14px',
                fontSize: '0.9375rem',
                borderColor: '#dc2626',
                color: '#dc2626',
                opacity: isInningsComplete ? 0.5 : 1,
                touchAction: 'manipulation',
              }}
            >
              Wicket
            </button>
          </>
        )}

        {/* Innings complete message */}
        {isInningsComplete && !isMatchComplete && (
          <div className="text-center mb-6 py-4" style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            <p className="text-sm font-medium" style={{ color: '#0066ff' }}>
              Innings {innings} Complete
            </p>
            <p className="text-xs mt-1" style={{ color: '#888' }}>
              {currentName}: {currentScore.runs}/{currentScore.wickets} ({ballsToOvers(currentScore.balls)})
            </p>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid #eee' }}>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="mono-btn"
            style={{ opacity: history.length === 0 ? 0.4 : 1, touchAction: 'manipulation' }}
          >
            Undo
          </button>

          <div className="flex gap-3">
            <button onClick={handleCancel} className="mono-btn">
              Cancel
            </button>
            {hasChanges && (
              <button onClick={saveDraft} className="mono-btn" style={{ borderColor: '#0066ff', color: '#0066ff' }}>
                Save Draft
              </button>
            )}
            <button onClick={saveMatch} className="mono-btn-primary">
              Save & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
