import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSportById } from '../../../models/sportRegistry';
import { loadSportTournaments, saveSportTournament } from '../../../utils/storage';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
    if (foundMatch.sets?.length > 0) {
      setSets(foundMatch.sets.map(s => ({ ...s, completed: s.completed || false })));
      const lastSetIndex = foundMatch.sets.length - 1;
      setCurrentSet(lastSetIndex);
    }
  }, [sport, id, matchId]);

  // Check if current set is complete
  const checkSetComplete = (set) => {
    if (!sportConfig) return false;

    const { pointsPerSet, deciderPoints, winBy, maxPoints } = sportConfig.config;
    const isDecider = currentSet === (tournament.format.sets - 1);
    const target = isDecider ? deciderPoints : pointsPerSet;
    const max = Math.max(set.score1, set.score2);
    const min = Math.min(set.score1, set.score2);

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

        // Check if match complete (only count completed sets)
        const t1SetsWon = newSets.filter(s => s.completed && s.score1 > s.score2).length;
        const t2SetsWon = newSets.filter(s => s.completed && s.score2 > s.score1).length;
        const setsToWin = Math.ceil(tournament.format.sets / 2);

        if (t1SetsWon >= setsToWin || t2SetsWon >= setsToWin) {
          // Match complete
          return newSets;
        }

        // Start next set
        if (currentSet < tournament.format.sets - 1) {
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
    const setsToWin = Math.ceil(tournament.format.sets / 2);

    // Match is only complete if someone has won enough sets
    const isMatchComplete = t1SetsWon >= setsToWin || t2SetsWon >= setsToWin;

    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            sets: setsToSave,
            status: isMatchComplete ? 'completed' : 'pending',
            winner: isMatchComplete ? (t1SetsWon > t2SetsWon ? m.team1Id : m.team2Id) : null,
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
  const isDeciderSet = currentSet === (tournament.format.sets - 1);
  const targetPoints = isDeciderSet && deciderPoints ? deciderPoints : pointsPerSet;
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
            Set {currentSet + 1} of {tournament.format.sets}
          </span>
        </div>

        {/* Score cards - side by side */}
        <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '250px' }}>
          {/* Team 1 Card */}
          <div
            className="flex-1 flex flex-col items-center justify-center mono-card"
            onClick={() => !isCurrentSetComplete && addPoint(1)}
            style={{
              padding: '24px 16px',
              cursor: isCurrentSetComplete ? 'default' : 'pointer',
              opacity: isCurrentSetComplete ? 0.6 : 1,
              touchAction: 'manipulation',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team1Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
              {sets[currentSet]?.score1 || 0}
            </p>
            <p className="text-xs mt-4" style={{ color: '#bbb' }}>
              {isCurrentSetComplete ? 'Set complete' : 'Tap to score'}
            </p>
          </div>

          {/* Team 2 Card */}
          <div
            className="flex-1 flex flex-col items-center justify-center mono-card"
            onClick={() => !isCurrentSetComplete && addPoint(2)}
            style={{
              padding: '24px 16px',
              cursor: isCurrentSetComplete ? 'default' : 'pointer',
              opacity: isCurrentSetComplete ? 0.6 : 1,
              touchAction: 'manipulation',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team2Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
              {sets[currentSet]?.score2 || 0}
            </p>
            <p className="text-xs mt-4" style={{ color: '#bbb' }}>
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
            <button onClick={saveMatch} className="mono-btn-primary">
              Save & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
