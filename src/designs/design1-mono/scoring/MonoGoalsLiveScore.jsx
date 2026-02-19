import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSportById } from '../../../models/sportRegistry';
import { loadSportTournaments, saveSportTournament } from '../../../utils/storage';
import { useTimer } from '../../../hooks/useTimer';

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

export default function MonoGoalsLiveScore() {
  const navigate = useNavigate();
  const { sport, id, matchId } = useParams();

  // Core state
  const [sportConfig, setSportConfig] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);

  // Scoring state
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [history, setHistory] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Timer for timed mode
  const timer = useTimer();
  const [timerStarted, setTimerStarted] = useState(false);

  // Debounce ref for rapid clicks
  const lastClickRef = useRef(0);
  // Track current scores for history snapshots
  const score1Ref = useRef(score1);
  const score2Ref = useRef(score2);
  score1Ref.current = score1;
  score2Ref.current = score2;

  // Load tournament and match
  useEffect(() => {
    const config = getSportById(sport);
    if (!config) return;

    const tournaments = loadSportTournaments(config.storageKey);
    const found = tournaments.find(t => t.id === Number(id));
    if (!found) return;

    const foundMatch = found.matches.find(m => m.id === matchId);
    if (!foundMatch) return;

    setSportConfig(config);
    setTournament(found);
    setMatch(foundMatch);

    // Initialize from existing score if editing
    if (foundMatch.score1 !== null && foundMatch.score1 !== undefined && !foundMatch.draftState) {
      setScore1(foundMatch.score1);
      setScore2(foundMatch.score2);
    }

    // Restore from draft if exists
    if (foundMatch.draftState) {
      setScore1(foundMatch.draftState.score1);
      setScore2(foundMatch.draftState.score2);
      setHistory(foundMatch.draftState.history || []);
    }
  }, [sport, id, matchId]);

  // Start timer for timed mode
  useEffect(() => {
    if (!tournament || !timerStarted) return;
    const formatMode = tournament.format?.mode;
    if (formatMode === 'timed' && tournament.format?.timeLimit) {
      timer.start();
    }
  }, [tournament, timerStarted]);

  // Auto-end match when time expires in timed mode
  useEffect(() => {
    if (!tournament || !sportConfig) return;
    const formatMode = tournament.format?.mode;
    const timeLimit = tournament.format?.timeLimit;

    if (formatMode === 'timed' && timeLimit && timer.elapsed >= timeLimit) {
      // Time's up - auto-save match
      triggerConfetti();
      triggerHaptic([100, 100, 100, 100, 100]);

      setTimeout(() => {
        const updatedMatches = tournament.matches.map(m =>
          m.id === matchId
            ? {
                ...m,
                score1,
                score2,
                status: 'completed',
                winner: score1 > score2 ? m.team1Id : score2 > score1 ? m.team2Id : 'draw',
                draftState: undefined,
              }
            : m
        );
        saveSportTournament(sportConfig.storageKey, {
          ...tournament,
          matches: updatedMatches,
        });
        navigate(`/${sport}/tournament/${id}`);
      }, 300);
    }
  }, [timer.elapsed, tournament, sportConfig, score1, score2, matchId, sport, id, navigate]);

  // Add point/goal
  const addScore = (team, value = 1) => {
    if (!sportConfig || !tournament) return;

    // Check if time is up in timed mode
    const formatMode = tournament.format?.mode;
    const timeLimit = tournament.format?.timeLimit;
    if (formatMode === 'timed' && timeLimit && timer.elapsed >= timeLimit) {
      return; // Don't allow scoring after time expires
    }

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Start timer on first action (timed mode)
    if (!timerStarted) {
      setTimerStarted(true);
    }

    // Haptic feedback: short pulse on score
    triggerHaptic(50);

    // Save to history BEFORE modifying (use refs for current values)
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      score1: score1Ref.current,
      score2: score2Ref.current,
    }].slice(-100));

    setHasChanges(true);

    // Calculate new scores
    const newScore1 = team === 1 ? score1Ref.current + value : score1Ref.current;
    const newScore2 = team === 2 ? score2Ref.current + value : score2Ref.current;

    // Update score
    if (team === 1) {
      setScore1(newScore1);
    } else {
      setScore2(newScore2);
    }

    // Auto-end in points mode (formatMode already declared above)
    if ((formatMode || 'free') === 'points' && tournament.format.target) {
      if (newScore1 >= tournament.format.target || newScore2 >= tournament.format.target) {
        triggerConfetti();
        triggerHaptic([100, 100, 100, 100, 100]);

        // Save match as completed
        setTimeout(() => {
          const updatedMatches = tournament.matches.map(m =>
            m.id === matchId
              ? {
                  ...m,
                  score1: newScore1,
                  score2: newScore2,
                  status: 'completed',
                  winner: newScore1 > newScore2 ? m.team1Id : newScore2 > newScore1 ? m.team2Id : 'draw',
                  draftState: undefined,
                }
              : m
          );
          saveSportTournament(sportConfig.storageKey, {
            ...tournament,
            matches: updatedMatches,
          });
          navigate(`/${sport}/tournament/${id}`);
        }, 300);
      }
    }
  };

  // Undo last action
  const undo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setScore1(last.score1);
    setScore2(last.score2);
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
              score1,
              score2,
              history: JSON.parse(JSON.stringify(history.slice(-50))),
              savedAt: new Date().toISOString(),
            },
          }
        : m
    );

    saveSportTournament(sportConfig.storageKey, {
      ...tournament,
      matches: updatedMatches,
    });

    setHasChanges(false);
    alert('Draft saved! You can resume this match later.');
    navigate(`/${sport}/tournament/${id}`);
  };

  // Keyboard shortcuts (skip on touch-only devices)
  useEffect(() => {
    if (isTouchDevice) return;

    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'q':
          addScore(1, 1);
          break;
        case 'p':
          addScore(2, 1);
          break;
        case 'u':
          undo();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [score1, score2, history, sportConfig, tournament]); // Dependencies for addScore/undo

  // Save match and return
  const saveMatch = () => {
    // Check for draw if not allowed
    if (!sportConfig.config.drawAllowed && score1 === score2) {
      alert(`Draws not allowed in ${sportConfig.name}`);
      return;
    }

    // Trigger celebration for completed match
    if (score1 !== 0 || score2 !== 0) {
      triggerConfetti();
      triggerHaptic([100, 100, 100, 100, 100]); // Victory pattern
    }

    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            score1,
            score2,
            status: 'completed',
            winner: score1 > score2 ? m.team1Id : score2 > score1 ? m.team2Id : 'draw',
            draftState: undefined, // Clear draft state
          }
        : m
    );

    saveSportTournament(sportConfig.storageKey, {
      ...tournament,
      matches: updatedMatches,
    });

    // Delay navigation slightly to show confetti
    setTimeout(() => {
      navigate(`/${sport}/tournament/${id}`);
    }, 300);
  };

  // Cancel and return
  const handleCancel = () => {
    if (hasChanges && !window.confirm('Discard unsaved changes?')) return;
    navigate(`/${sport}/tournament/${id}`);
  };

  if (!sportConfig || !tournament || !match) {
    return <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <p style={{ color: '#888' }}>Loading...</p>
    </div>;
  }

  const getTeamName = (teamId) => {
    return tournament.teams.find(t => t.id === teamId)?.name || 'Unknown';
  };

  const team1Name = getTeamName(match.team1Id);
  const team2Name = getTeamName(match.team2Id);
  const quickButtons = sportConfig.config.quickButtons;

  // Timed mode helpers
  const isTimedMode = tournament.format?.mode === 'timed';
  const timeLimit = isTimedMode ? tournament.format.timeLimit : null;
  const remainingSeconds = isTimedMode && timeLimit ? Math.max(0, timeLimit - timer.elapsed) : null;
  const isTimeUp = isTimedMode && remainingSeconds === 0;

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
          {isTimedMode ? (
            <span className={`mono-badge ${isTimeUp ? 'mono-badge-paused' : 'mono-badge-live'}`} style={{ color: isTimeUp ? '#dc2626' : undefined }}>
              {isTimeUp ? "Time's up!" : formatCountdown(remainingSeconds)}
            </span>
          ) : (
            <span className="mono-badge mono-badge-live">
              {tournament.format?.mode === 'points' ? `First to ${tournament.format.target}` : 'Live Scoring'}
            </span>
          )}
        </div>

        {/* ARIA live region for score announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {team1Name}: {score1}. {team2Name}: {score2}.
        </div>

        {/* Score cards - side by side */}
        <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '280px' }}>
          {/* Team 1 Card */}
          <div
            className="flex-1 flex flex-col items-center justify-center mono-card"
            style={{ padding: '24px 16px' }}
            role="region"
            aria-label={`${team1Name} scoring`}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team1Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score mb-4" style={{ color: '#111' }} aria-label={`${team1Name} score: ${score1}`}>
              {score1}
            </p>

            {/* Quick buttons or simple +1 */}
            <div className="flex flex-col gap-2 w-full px-4">
              {quickButtons ? (
                quickButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => addScore(1, btn.value)}
                    className="mono-btn text-sm py-2"
                    style={{ touchAction: 'manipulation', opacity: isTimeUp ? 0.4 : 1 }}
                    disabled={isTimeUp}
                    aria-label={`Add ${btn.value} ${btn.value === 1 ? 'point' : 'points'} to ${team1Name}`}
                  >
                    {btn.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => addScore(1, 1)}
                  className="mono-btn-primary text-lg py-3"
                  style={{ touchAction: 'manipulation', opacity: isTimeUp ? 0.4 : 1 }}
                  disabled={isTimeUp}
                  aria-label={`Add 1 point to ${team1Name}`}
                >
                  + 1
                </button>
              )}
            </div>
          </div>

          {/* Team 2 Card */}
          <div
            className="flex-1 flex flex-col items-center justify-center mono-card"
            style={{ padding: '24px 16px' }}
            role="region"
            aria-label={`${team2Name} scoring`}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team2Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score mb-4" style={{ color: '#111' }} aria-label={`${team2Name} score: ${score2}`}>
              {score2}
            </p>

            {/* Quick buttons or simple +1 */}
            <div className="flex flex-col gap-2 w-full px-4">
              {quickButtons ? (
                quickButtons.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={() => addScore(2, btn.value)}
                    className="mono-btn text-sm py-2"
                    style={{ touchAction: 'manipulation', opacity: isTimeUp ? 0.4 : 1 }}
                    disabled={isTimeUp}
                    aria-label={`Add ${btn.value} ${btn.value === 1 ? 'point' : 'points'} to ${team2Name}`}
                  >
                    {btn.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => addScore(2, 1)}
                  className="mono-btn-primary text-lg py-3"
                  style={{ touchAction: 'manipulation', opacity: isTimeUp ? 0.4 : 1 }}
                  disabled={isTimeUp}
                  aria-label={`Add 1 point to ${team2Name}`}
                >
                  + 1
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-center mb-2" style={{ color: '#bbb' }}>
          {isTimedMode ? `${Math.floor(timeLimit / 60)} min match` :
           tournament.format?.mode === 'points' ? `First to ${tournament.format.target}` : 'Free play'}
          {' · '}
          {sportConfig.config.drawAllowed ? 'Draws allowed' : 'No draws'}
        </p>
        {!isTouchDevice && (
          <p className="text-xs text-center mb-6" style={{ color: '#ccc' }}>
            Keyboard: Q = {team1Name} &middot; P = {team2Name} &middot; U = Undo
          </p>
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
