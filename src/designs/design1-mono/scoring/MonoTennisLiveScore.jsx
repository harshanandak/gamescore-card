import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSportById } from '../../../models/sportRegistry';
import { loadSportTournaments, saveSportTournament } from '../../../utils/storage';
import { updateMatchInTournament } from '../../../utils/knockoutManager';

// Haptic feedback helper
const triggerHaptic = (pattern) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// Confetti helper
const triggerConfetti = () => {
  const prefersReducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const overlay = document.createElement('div');
  overlay.className = 'mono-confetti-overlay';

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'mono-confetti mono-confetti-animate';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    overlay.appendChild(confetti);
  }

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 3500);
};

// Convert point value to tennis display (0→0, 1→15, 2→30, 3→40)
const pointToDisplay = (points) => {
  const map = { 0: '0', 1: '15', 2: '30', 3: '40' };
  return map[points] || points;
};

// Show game won notification
const showGameWon = (teamName, gameNumber, setNumber) => {
  const notification = document.createElement('div');
  notification.className = 'mono-set-won mono-set-won-animate';
  notification.textContent = `${teamName} wins Game ${gameNumber} (Set ${setNumber})!`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 1500);
};

// Show set won notification
const showSetWon = (teamName, setNumber) => {
  const notification = document.createElement('div');
  notification.className = 'mono-set-won mono-set-won-animate';
  notification.textContent = `${teamName} wins Set ${setNumber}!`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 1500);
};

export default function MonoTennisLiveScore() {
  const navigate = useNavigate();
  const { sport, id, matchId } = useParams();
  const lastClickRef = useRef(0);

  // Core state
  const [sportConfig, setSportConfig] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);

  // Tennis state structure
  const initializeSets = () => {
    const numSets = tournament?.format?.sets || 3; // Best of 3 or 5
    return Array(numSets).fill(null).map((_, idx) => ({
      games1: 0,
      games2: 0,
      points1: 0,
      points2: 0,
      isDeuce: false,
      advantage: null, // 1 or 2 for advantage
      isTiebreak: false,
      tiebreakPoints1: 0,
      tiebreakPoints2: 0,
      completed: false,
    }));
  };

  const [sets, setSets] = useState(() => {
    if (match?.sets && match.sets.length > 0) {
      return match.sets;
    }
    return initializeSets();
  });

  const [currentSet, setCurrentSet] = useState(() => {
    if (match?.draftState?.currentSet !== undefined) {
      return match.draftState.currentSet;
    }
    return 0;
  });

  const [history, setHistory] = useState(() => {
    if (match?.draftState?.history) {
      return match.draftState.history;
    }
    return [];
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [sidesSwapped, setSidesSwapped] = useState(false);

  // Load tournament and match data
  useEffect(() => {
    const config = getSportById(sport);
    if (!config) return;

    const tournaments = loadSportTournaments(config.storageKey);
    const found = tournaments.find(t => t.id === Number(id));
    if (!found) return;

    const foundMatch = found.matches.find(m => m.id === matchId)
      || (found.knockoutMatches || []).find(m => m.id === matchId);
    if (!foundMatch) return;

    setSportConfig(config);
    setTournament(found);
    setMatch(foundMatch);

    // Initialize from existing score if editing
    if (foundMatch.sets?.length > 0 && !foundMatch.draftState) {
      setSets(foundMatch.sets);
      const lastSetIndex = foundMatch.sets.findIndex(s => !s.completed);
      setCurrentSet(lastSetIndex >= 0 ? lastSetIndex : foundMatch.sets.length - 1);
    }

    // Restore from draft if exists
    if (foundMatch.draftState) {
      setSets(foundMatch.draftState.sets);
      setCurrentSet(foundMatch.draftState.currentSet);
      setHistory(foundMatch.draftState.history || []);
    }
  }, [sport, id, matchId]);

  // Get team names
  const team1 = tournament?.teams?.find(t => t.id === match?.team1Id);
  const team2 = tournament?.teams?.find(t => t.id === match?.team2Id);
  const team1Name = team1?.name || 'Team 1';
  const team2Name = team2?.name || 'Team 2';

  // Side swap helpers
  const leftName = sidesSwapped ? team2Name : team1Name;
  const rightName = sidesSwapped ? team1Name : team2Name;

  // Check if set is complete
  const isSetComplete = (set) => {
    if (set.isTiebreak) {
      // Tiebreak: First to 7 with 2-point margin
      const tb1 = set.tiebreakPoints1;
      const tb2 = set.tiebreakPoints2;
      return (tb1 >= 7 && tb1 - tb2 >= 2) || (tb2 >= 7 && tb2 - tb1 >= 2);
    }

    // Regular set: First to 6 games with 2-game margin
    const g1 = set.games1;
    const g2 = set.games2;

    // If 6-6, go to tiebreak
    if (g1 === 6 && g2 === 6) {
      return false; // Will switch to tiebreak
    }

    // Win by reaching 6 with 2-game margin
    return (g1 >= 6 && g1 - g2 >= 2) || (g2 >= 6 && g2 - g1 >= 2);
  };

  // Check if match is complete
  const isMatchComplete = useMemo(() => {
    const completedSets = sets.filter(s => s.completed);
    const setsToWin = Math.ceil(sets.length / 2); // Best of 3: need 2, Best of 5: need 3

    let team1Sets = 0;
    let team2Sets = 0;

    completedSets.forEach(set => {
      if (set.isTiebreak) {
        if (set.tiebreakPoints1 > set.tiebreakPoints2) team1Sets++;
        else team2Sets++;
      } else {
        if (set.games1 > set.games2) team1Sets++;
        else team2Sets++;
      }
    });

    return team1Sets >= setsToWin || team2Sets >= setsToWin;
  }, [sets]);

  // Add point to team
  const addPoint = (team) => {
    // Debounce rapid clicks (150ms)
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // If match complete, don't allow more points
    if (isMatchComplete) return;

    // Save history for undo
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      sets: structuredClone(sets),
      currentSet,
    }].slice(-100)); // Keep last 100 actions

    setSets(prevSets => {
      const newSets = prevSets.map(s => ({ ...s }));
      const set = newSets[currentSet];

      if (set.completed) return prevSets; // Can't score on completed set

      // Haptic feedback
      triggerHaptic([50]);

      // Handle tiebreak scoring
      if (set.isTiebreak) {
        if (team === 1) {
          set.tiebreakPoints1++;
        } else {
          set.tiebreakPoints2++;
        }

        // Check if tiebreak is complete
        if (isSetComplete(set)) {
          set.completed = true;
          triggerHaptic([50, 100, 50]); // Double pulse for set won
          const winner = set.tiebreakPoints1 > set.tiebreakPoints2 ? team1Name : team2Name;
          showSetWon(winner, currentSet + 1);

          // Auto-advance to next set if match not complete
          if (currentSet < sets.length - 1) {
            setCurrentSet(currentSet + 1);
          }
        }

        return newSets;
      }

      // Regular game scoring
      if (team === 1) {
        set.points1++;
      } else {
        set.points2++;
      }

      const p1 = set.points1;
      const p2 = set.points2;

      // Check for deuce (40-40)
      if (p1 >= 3 && p2 >= 3) {
        set.isDeuce = true;

        if (p1 === p2) {
          // Back to deuce
          set.advantage = null;
        } else if (p1 > p2) {
          // Player 1 advantage
          set.advantage = 1;
        } else {
          // Player 2 advantage
          set.advantage = 2;
        }

        // Check for game won from advantage
        if (p1 - p2 >= 2) {
          // Team 1 wins game
          set.games1++;
          set.points1 = 0;
          set.points2 = 0;
          set.isDeuce = false;
          set.advantage = null;
          triggerHaptic([50, 100, 50]);
          showGameWon(team1Name, set.games1, currentSet + 1);
        } else if (p2 - p1 >= 2) {
          // Team 2 wins game
          set.games2++;
          set.points1 = 0;
          set.points2 = 0;
          set.isDeuce = false;
          set.advantage = null;
          triggerHaptic([50, 100, 50]);
          showGameWon(team2Name, set.games2, currentSet + 1);
        }
      } else if (p1 >= 4 || p2 >= 4) {
        // Regular game win (no deuce)
        if (p1 >= 4 && p1 - p2 >= 2) {
          // Team 1 wins game
          set.games1++;
          set.points1 = 0;
          set.points2 = 0;
          triggerHaptic([50, 100, 50]);
          showGameWon(team1Name, set.games1, currentSet + 1);
        } else if (p2 >= 4 && p2 - p1 >= 2) {
          // Team 2 wins game
          set.games2++;
          set.points1 = 0;
          set.points2 = 0;
          triggerHaptic([50, 100, 50]);
          showGameWon(team2Name, set.games2, currentSet + 1);
        }
      }

      // Check for 6-6 → tiebreak
      if (set.games1 === 6 && set.games2 === 6 && !set.isTiebreak) {
        set.isTiebreak = true;
        set.tiebreakPoints1 = 0;
        set.tiebreakPoints2 = 0;
      }

      // Check if set is complete
      if (isSetComplete(set)) {
        set.completed = true;
        triggerHaptic([50, 100, 50]);
        const winner = set.games1 > set.games2 ? team1Name : team2Name;
        showSetWon(winner, currentSet + 1);

        // Auto-advance to next set if match not complete
        if (currentSet < sets.length - 1) {
          setCurrentSet(currentSet + 1);
        }
      }

      return newSets;
    });

    setHasChanges(true);
  };

  // Undo last action
  const undo = () => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setSets(lastState.sets);
    setCurrentSet(lastState.currentSet);
    setHistory(prev => prev.slice(0, -1));
    setHasChanges(true);
  };

  // Keyboard shortcuts (desktop only)
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    const hasTouch = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return; // Disable keyboard on touch devices

    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'q':
          addPoint(leftTeam);
          break;
        case 'p':
          addPoint(rightTeam);
          break;
        case 'u':
          undo();
          break;
      }
    };

    globalThis.addEventListener('keydown', handleKeyPress);
    return () => globalThis.removeEventListener('keydown', handleKeyPress);
  }, [currentSet, sets, history, sportConfig, tournament, sidesSwapped]);

  // Save draft
  const saveDraft = () => {
    const updatedTournament = updateMatchInTournament(tournament, matchId, m => ({
      ...m,
      sets,
      status: 'in-progress',
      draftState: {
        currentSet,
        sets,
        history,
        savedAt: new Date().toISOString(),
      },
    }));

    saveSportTournament(sportConfig.storageKey, updatedTournament);
    alert('Draft saved! You can resume this match later.');
    navigate(`/design1/${tournament.sportId}/tournament`);
  };

  // Save match and return
  const saveMatch = () => {
    // Trigger celebration for completed match
    if (isMatchComplete) {
      triggerConfetti();
      triggerHaptic([100, 100, 100, 100, 100]); // Victory pattern
    }

    // Determine winner
    let team1SetsWon = 0;
    let team2SetsWon = 0;

    sets.filter(s => s.completed).forEach(set => {
      if (set.isTiebreak) {
        if (set.tiebreakPoints1 > set.tiebreakPoints2) team1SetsWon++;
        else team2SetsWon++;
      } else {
        if (set.games1 > set.games2) team1SetsWon++;
        else team2SetsWon++;
      }
    });

    let winner = null;
    if (team1SetsWon > team2SetsWon) winner = match.team1Id;
    else if (team2SetsWon > team1SetsWon) winner = match.team2Id;

    const updatedTournament = updateMatchInTournament(tournament, matchId, m => ({
      ...m,
      sets,
      status: isMatchComplete ? 'completed' : 'in-progress',
      winner,
      draftState: isMatchComplete ? null : {
        currentSet,
        sets,
        history,
        savedAt: new Date().toISOString(),
      },
    }));

    saveSportTournament(sportConfig.storageKey, updatedTournament);
    navigate(`/design1/${tournament.sportId}/tournament`);
  };

  // Cancel and discard changes
  const handleCancel = () => {
    if (hasChanges) {
      const confirm = globalThis.confirm('You have unsaved changes. Discard them?');
      if (!confirm) return;
    }
    navigate(`/design1/${tournament.sportId}/tournament`);
  };

  if (!tournament || !match) {
    return <div className="max-w-2xl mx-auto px-6 py-10">Match not found.</div>;
  }

  const currentSetData = sets[currentSet];
  const isTiebreakMode = currentSetData?.isTiebreak;

  // Display score for current game/tiebreak
  let score1Display, score2Display;

  if (isTiebreakMode) {
    score1Display = currentSetData.tiebreakPoints1;
    score2Display = currentSetData.tiebreakPoints2;
  } else if (currentSetData.isDeuce) {
    if (currentSetData.advantage === 1) {
      score1Display = 'AD';
      score2Display = '40';
    } else if (currentSetData.advantage === 2) {
      score1Display = '40';
      score2Display = 'AD';
    } else {
      score1Display = '40';
      score2Display = '40';
    }
  } else {
    score1Display = pointToDisplay(currentSetData.points1);
    score2Display = pointToDisplay(currentSetData.points2);
  }

  // Side swap derived display values
  const leftScoreDisplay = sidesSwapped ? score2Display : score1Display;
  const rightScoreDisplay = sidesSwapped ? score1Display : score2Display;
  const leftGames = sidesSwapped ? currentSetData.games2 : currentSetData.games1;
  const rightGames = sidesSwapped ? currentSetData.games1 : currentSetData.games2;
  const leftTeam = sidesSwapped ? 2 : 1;
  const rightTeam = sidesSwapped ? 1 : 2;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 mono-transition mono-visible">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleCancel}
          className="text-sm bg-transparent border-none cursor-pointer font-swiss"
          style={{ color: '#888' }}
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setSidesSwapped(s => !s); }}
            className="mono-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              minWidth: 0,
              touchAction: 'manipulation',
              borderColor: sidesSwapped ? '#0066ff' : '#ddd',
              color: sidesSwapped ? '#0066ff' : '#111',
            }}
            title="Swap sides"
          >
            Swap
          </button>
          <span
            className={`mono-badge ${isTiebreakMode ? 'mono-badge-paused' : 'mono-badge-live'}`}
          >
            {isTiebreakMode ? 'Tiebreak' : `Set ${currentSet + 1} of ${sets.length}`}
          </span>
          {isMatchComplete && (
            <span className="mono-badge mono-badge-final">Match Complete</span>
          )}
        </div>
      </div>

      {/* ARIA live region for score announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {leftName}: {leftScoreDisplay}. {rightName}: {rightScoreDisplay}.
        {isTiebreakMode ? 'Tiebreak' : `Set ${currentSet + 1} of ${sets.length}`}.
      </div>

      {/* Score cards */}
      <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '250px' }}>
        {/* Left Team */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !currentSetData.completed && addPoint(leftTeam)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !currentSetData.completed) {
              e.preventDefault();
              addPoint(leftTeam);
            }
          }}
          aria-label={`${leftName}: ${leftScoreDisplay}. Press Enter or click to add point`}
          aria-disabled={currentSetData.completed}
          className="flex-1 mono-card flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{
            touchAction: 'manipulation',
            borderColor: currentSetData.completed ? '#ddd' : '#0066ff',
            opacity: currentSetData.completed ? 0.6 : 1,
          }}
        >
          <p className="text-sm uppercase tracking-widest font-normal" style={{ color: '#888' }}>
            {leftName}
          </p>
          <p
            className="text-7xl font-bold mono-score font-mono"
            style={{ color: '#111' }}
          >
            {leftScoreDisplay}
          </p>
          <p className="text-xs" style={{ color: '#888' }}>
            Games: {leftGames}
          </p>
        </div>

        {/* Right Team */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !currentSetData.completed && addPoint(rightTeam)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !currentSetData.completed) {
              e.preventDefault();
              addPoint(rightTeam);
            }
          }}
          aria-label={`${rightName}: ${rightScoreDisplay}. Press Enter or click to add point`}
          aria-disabled={currentSetData.completed}
          className="flex-1 mono-card flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{
            touchAction: 'manipulation',
            borderColor: currentSetData.completed ? '#ddd' : '#0066ff',
            opacity: currentSetData.completed ? 0.6 : 1,
          }}
        >
          <p className="text-sm uppercase tracking-widest font-normal" style={{ color: '#888' }}>
            {rightName}
          </p>
          <p
            className="text-7xl font-bold mono-score font-mono"
            style={{ color: '#111' }}
          >
            {rightScoreDisplay}
          </p>
          <p className="text-xs" style={{ color: '#888' }}>
            Games: {rightGames}
          </p>
        </div>
      </div>

      {/* Keyboard shortcuts hint (desktop only) */}
      {!isTouchDevice && (
        <p className="text-xs text-center mb-6" style={{ color: '#ccc' }}>
          Keyboard: Q = {leftName} · P = {rightName} · U = Undo
        </p>
      )}

      {/* Set history */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-widest font-normal mb-3" style={{ color: '#888' }}>
          Match Score
        </h3>
        <div className="flex flex-col gap-2">
          {sets.map((set, idx) => {
            const isActive = idx === currentSet;
            const setLabel = `Set ${idx + 1}`;

            let scoreDisplay;
            if (set.isTiebreak && set.completed) {
              scoreDisplay = `${set.games1}-${set.games2} (${set.tiebreakPoints1}-${set.tiebreakPoints2})`;
            } else {
              scoreDisplay = `${set.games1}-${set.games2}`;
            }

            return (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-2 mono-card text-sm"
                style={{
                  borderColor: isActive ? '#0066ff' : '#eee',
                  backgroundColor: set.completed ? '#fafafa' : '#fff',
                }}
              >
                <span style={{ color: isActive ? '#0066ff' : '#888' }}>{setLabel}</span>
                <span className="font-mono font-bold" style={{ color: '#111' }}>
                  {scoreDisplay}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div>
        <button onClick={saveMatch} className="mono-btn-primary w-full mb-3" style={{ padding: '12px', fontSize: '0.875rem' }}>
          Save &amp; Return
        </button>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="mono-btn flex-1"
            style={{ padding: '8px', fontSize: '0.8125rem', opacity: history.length === 0 ? 0.4 : 1, touchAction: 'manipulation' }}
          >
            Undo
          </button>
          <button onClick={handleCancel} className="mono-btn flex-1" style={{ padding: '8px', fontSize: '0.8125rem' }}>
            Cancel
          </button>
          {hasChanges && !isMatchComplete && (
            <button onClick={saveDraft} className="mono-btn flex-1" style={{ padding: '8px', fontSize: '0.8125rem', borderColor: '#0066ff', color: '#0066ff' }}>
              Save Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
