import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSportById } from '../../../models/sportRegistry';
import { loadSportTournaments, saveSportTournament } from '../../../utils/storage';

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
    if (foundMatch.score1 !== null && foundMatch.score1 !== undefined) {
      setScore1(foundMatch.score1);
      setScore2(foundMatch.score2);
    }
  }, [sport, id, matchId]);

  // Add point/goal
  const addScore = (team, value = 1) => {
    if (!sportConfig || !tournament) return;

    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickRef.current < 150) return;
    lastClickRef.current = now;

    // Save to history BEFORE modifying (use refs for current values)
    setHistory(prev => [...prev, {
      timestamp: Date.now(),
      score1: score1Ref.current,
      score2: score2Ref.current,
    }].slice(-100));

    setHasChanges(true);

    // Update score
    if (team === 1) {
      setScore1(prev => prev + value);
    } else {
      setScore2(prev => prev + value);
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

    const updatedMatches = tournament.matches.map(m =>
      m.id === matchId
        ? {
            ...m,
            score1,
            score2,
            status: 'completed',
            winner: score1 > score2 ? m.team1Id : score2 > score1 ? m.team2Id : 'draw',
          }
        : m
    );

    saveSportTournament(sportConfig.storageKey, {
      ...tournament,
      matches: updatedMatches,
    });

    navigate(`/${sport}/tournament/${id}`);
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
          <span className="mono-badge mono-badge-live">
            Live Scoring
          </span>
        </div>

        {/* Score cards - side by side */}
        <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '280px' }}>
          {/* Team 1 Card */}
          <div
            className="flex-1 flex flex-col items-center justify-center mono-card"
            style={{ padding: '24px 16px' }}
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team1Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score mb-4" style={{ color: '#111' }}>
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
                    style={{ touchAction: 'manipulation' }}
                  >
                    {btn.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => addScore(1, 1)}
                  className="mono-btn-primary text-lg py-3"
                  style={{ touchAction: 'manipulation' }}
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
          >
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
              {team2Name}
            </p>
            <p className="text-6xl font-bold font-mono mono-score mb-4" style={{ color: '#111' }}>
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
                    style={{ touchAction: 'manipulation' }}
                  >
                    {btn.label}
                  </button>
                ))
              ) : (
                <button
                  onClick={() => addScore(2, 1)}
                  className="mono-btn-primary text-lg py-3"
                  style={{ touchAction: 'manipulation' }}
                >
                  + 1
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-center mb-2" style={{ color: '#bbb' }}>
          {sportConfig.config.drawAllowed ? 'Draws allowed' : 'No draws'} · Tap buttons to score
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
            <button onClick={saveMatch} className="mono-btn-primary">
              Save & Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
