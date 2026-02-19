import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSportById } from '../../../models/sportRegistry';
import { loadSportTournaments, saveSportTournament } from '../../../utils/storage';

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

export default function MonoSetsLiveScore() {
  const navigate = useNavigate();
  const { sport, id, matchId } = useParams();

  // Core state
  const [sportConfig, setSportConfig] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);

  // Scoring state
  const [currentSet, setCurrentSet] = useState(0);
  const [sets, setSets] = useState([{ score1: 0, score2: 0, completed: false }]);
  const [history, setHistory] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Animation state
  const [showSetWon, setShowSetWon] = useState(false);
  const [setWonTeam, setSetWonTeam] = useState('');

  // Debounce ref for rapid clicks
  const lastClickRef = useRef(0);

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
    if (foundMatch.sets?.length > 0 && !foundMatch.draftState) {
      setSets(foundMatch.sets.map(s => ({ ...s, completed: s.completed || false })));
      const lastSetIndex = foundMatch.sets.length - 1;
      setCurrentSet(lastSetIndex);
    }

    // Restore from draft if exists
    if (foundMatch.draftState) {
      setSets(foundMatch.draftState.sets);
      setCurrentSet(foundMatch.draftState.currentSet);
      setHistory(foundMatch.draftState.history || []);
    }
  }, [sport, id, matchId]);

  // Check if current set is complete
  const checkSetComplete = (set) => {
    if (!sportConfig) return false;

    const { winBy, maxPoints } = sportConfig.config;
    const max = Math.max(set.score1, set.score2);
    const min = Math.min(set.score1, set.score2);

    // Default to best-of if type not specified (backwards compatibility)
    const formatType = tournament.format.type || 'best-of';

    // Single-set format
    if (formatType === 'single') {
      const target = tournament.format.points;
      if (max < target) return false;
      if (max - min < winBy) return false;
      if (maxPoints && max >= maxPoints && max > min) return true;
      return true;
    }

    // Best-of format
    const { pointsPerSet, deciderPoints } = sportConfig.config;
    const totalSets = tournament.format.sets || 1;
    const isDecider = totalSets > 1 && currentSet === (totalSets - 1);
    const target = isDecider && deciderPoints ? deciderPoints : (tournament.format.points || pointsPerSet);

    // Must reach target
    if (max < target) return false;

    // Must win by N
    if (max - min < winBy) return false;

    // Badminton cap at 30
    if (maxPoints && max >= maxPoints && max > min) return true;

    return true;
  };

  // Add point
  const addPoint = (team) => {
    if (!sportConfig || !tournament) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Don't allow scoring on completed sets
    if (sets[currentSet]?.completed) return;

    // Haptic feedback: short pulse on point scored
    triggerHaptic(50);

    // Save to history BEFORE modifying
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      sets: JSON.parse(JSON.stringify(sets)),
      currentSet,
    }].slice(-100)); // Keep last 100

    setHasChanges(true);

    setSets(prevSets => {
      const newSets = prevSets.map(s => ({ ...s }));
      const scoreKey = team === 1 ? 'score1' : 'score2';
      newSets[currentSet][scoreKey]++;

      // Check if set complete
      const isComplete = checkSetComplete(newSets[currentSet]);
      if (isComplete) {
        newSets[currentSet].completed = true;

        // Haptic feedback: double pulse for set won
        triggerHaptic([50, 100, 50]);

        // Show set won notification
        const winningTeam = newSets[currentSet].score1 > newSets[currentSet].score2
          ? (match.team1Id === tournament.teams[0]?.id ? tournament.teams[0]?.name : tournament.teams.find(t => t.id === match.team1Id)?.name)
          : (match.team2Id === tournament.teams[0]?.id ? tournament.teams[0]?.name : tournament.teams.find(t => t.id === match.team2Id)?.name);

        setSetWonTeam(winningTeam || `Team ${team}`);
        setShowSetWon(true);
        setTimeout(() => setShowSetWon(false), 1500);

        const formatType = tournament.format.type || 'best-of';

        // Single-set format: match ends after first set
        if (formatType === 'single') {
          triggerConfetti();
          triggerHaptic([100, 100, 100, 100, 100]); // Victory pattern
          return newSets;
        }

        // Best-of format: check if match complete
        const t1SetsWon = newSets.filter(s => s.completed && s.score1 > s.score2).length;
        const t2SetsWon = newSets.filter(s => s.completed && s.score2 > s.score1).length;
        const setsToWin = Math.ceil((tournament.format.sets || 1) / 2);

        if (t1SetsWon >= setsToWin || t2SetsWon >= setsToWin) {
          // Match complete - trigger confetti
          triggerConfetti();
          triggerHaptic([100, 100, 100, 100, 100]); // Victory pattern
          return newSets;
        }

        // Start next set
        if (currentSet < (tournament.format.sets || 1) - 1) {
          newSets.push({ score1: 0, score2: 0, completed: false });
          setCurrentSet(prev => prev + 1);
        }
      }

      return newSets;
    });
  };

  // Undo last action
  const undo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setSets(last.sets);
    setCurrentSet(last.currentSet);
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
              currentSet,
              sets: JSON.parse(JSON.stringify(sets)),
              history: JSON.parse(JSON.stringify(history.slice(-50))), // Keep last 50 for storage efficiency
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

  // Save match and return
  const saveMatch = () => {
    // Save all sets that have any score (including in-progress)
    const setsToSave = sets
      .filter(s => s.score1 > 0 || s.score2 > 0)
      .map(s => ({ score1: s.score1, score2: s.score2, completed: s.completed || false }));

    // Count completed sets to determine match status
    const completedSets = sets.filter(s => s.completed);
    const t1SetsWon = completedSets.filter(s => s.score1 > s.score2).length;
    const t2SetsWon = completedSets.filter(s => s.score2 > s.score1).length;

    const formatType = tournament.format.type || 'best-of';
    let isMatchComplete;
    if (formatType === 'single') {
      // Single-set format: match is complete when the one set is done
      isMatchComplete = completedSets.length > 0;
    } else {
      const setsToWin = Math.ceil((tournament.format.sets || 1) / 2);
      isMatchComplete = t1SetsWon >= setsToWin || t2SetsWon >= setsToWin;
    }

    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            sets: setsToSave,
            status: isMatchComplete ? 'completed' : 'in-progress',
            winner: isMatchComplete ? (t1SetsWon > t2SetsWon ? m.team1Id : m.team2Id) : null,
            draftState: isMatchComplete ? undefined : {
              currentSet,
              sets: JSON.parse(JSON.stringify(sets)),
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
          addPoint(1);
          break;
        case 'p':
          addPoint(2);
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
  }, [currentSet, sets, history, sportConfig, tournament]); // Dependencies for addPoint/undo

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

  const { pointsPerSet, deciderPoints, winBy } = sportConfig.config;
  const formatType = tournament.format.type || 'best-of';
  const totalSetsDisplay = tournament.format.sets || 1;
  const isDeciderSet = totalSetsDisplay > 1 && currentSet === (totalSetsDisplay - 1);
  const targetPoints = formatType === 'single'
    ? tournament.format.points
    : (isDeciderSet && deciderPoints ? deciderPoints : (tournament.format.points || pointsPerSet));
  const isCurrentSetComplete = sets[currentSet]?.completed || false;

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
          <span className={`mono-badge ${isCurrentSetComplete ? 'mono-badge-final' : 'mono-badge-live'}`}>
            {formatType === 'single' ? 'Single Set' : `Set ${currentSet + 1} of ${tournament.format.sets || 1}`}
          </span>
        </div>

        {/* ARIA live region for score announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {team1Name}: {sets[currentSet]?.score1 || 0}. {team2Name}: {sets[currentSet]?.score2 || 0}. Set {currentSet + 1} of {tournament?.format?.sets || 1}.
        </div>

        {/* Score cards - side by side */}
        <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '250px' }}>
          {/* Team 1 Card */}
          <div
            role="button"
            tabIndex={isCurrentSetComplete ? -1 : 0}
            className="flex-1 flex flex-col items-center justify-center mono-card"
            onClick={() => !isCurrentSetComplete && addPoint(1)}
            onKeyDown={(e) => {
              if (!isCurrentSetComplete && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                addPoint(1);
              }
            }}
            aria-label={`${team1Name}: ${sets[currentSet]?.score1 || 0} points. ${isCurrentSetComplete ? 'Set complete' : 'Press Enter or click to add point'}`}
            aria-disabled={isCurrentSetComplete}
            style={{
              padding: '24px 16px',
              cursor: isCurrentSetComplete ? 'default' : 'pointer',
              opacity: isCurrentSetComplete ? 0.6 : 1,
              touchAction: 'manipulation',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }} aria-hidden="true">
              {team1Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }} aria-hidden="true">
              {sets[currentSet]?.score1 || 0}
            </p>
            <p className="text-xs mt-4" style={{ color: '#bbb' }} aria-hidden="true">
              {isCurrentSetComplete ? 'Set complete' : 'Tap to score'}
            </p>
          </div>

          {/* Team 2 Card */}
          <div
            role="button"
            tabIndex={isCurrentSetComplete ? -1 : 0}
            className="flex-1 flex flex-col items-center justify-center mono-card"
            onClick={() => !isCurrentSetComplete && addPoint(2)}
            onKeyDown={(e) => {
              if (!isCurrentSetComplete && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                addPoint(2);
              }
            }}
            aria-label={`${team2Name}: ${sets[currentSet]?.score2 || 0} points. ${isCurrentSetComplete ? 'Set complete' : 'Press Enter or click to add point'}`}
            aria-disabled={isCurrentSetComplete}
            style={{
              padding: '24px 16px',
              cursor: isCurrentSetComplete ? 'default' : 'pointer',
              opacity: isCurrentSetComplete ? 0.6 : 1,
              touchAction: 'manipulation',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }} aria-hidden="true">
              {team2Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }} aria-hidden="true">
              {sets[currentSet]?.score2 || 0}
            </p>
            <p className="text-xs mt-4" style={{ color: '#bbb' }} aria-hidden="true">
              {isCurrentSetComplete ? 'Set complete' : 'Tap to score'}
            </p>
          </div>
        </div>

        {/* Rules info */}
        <p className="text-xs text-center mb-2" style={{ color: '#bbb' }}>
          {targetPoints} points to win &middot; Win by {winBy}
        </p>
        {!isTouchDevice && (
          <p className="text-xs text-center mb-6" style={{ color: '#ccc' }}>
            Keyboard: Q = {team1Name} &middot; P = {team2Name} &middot; U = Undo
          </p>
        )}

        {/* Set history */}
        {sets.filter(s => s.completed).length > 0 && (
          <div className="py-4 text-center text-sm mb-6" style={{ color: '#888', borderTop: '1px solid #eee' }}>
            <div className="flex justify-center gap-3 flex-wrap">
              {sets.filter(s => s.completed).map((s, i) => (
                <span key={i} className="font-mono">
                  Set {i + 1}: {s.score1}-{s.score2}
                </span>
              ))}
            </div>
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

      {/* Set Won Notification */}
      {showSetWon && (
        <div className="mono-set-won mono-set-won-animate">
          {setWonTeam} wins Set {currentSet}!
        </div>
      )}
    </div>
  );
}
