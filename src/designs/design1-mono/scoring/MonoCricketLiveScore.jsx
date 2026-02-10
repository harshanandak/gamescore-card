import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadCricketTournaments, saveCricketTournament } from '../../../utils/storage';
import { ballsToOvers, calculateRunRate } from '../../../utils/cricketCalculations';

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
    if (foundMatch.team1Score) {
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
  }, [id, matchId]);

  const totalBalls = tournament?.format?.overs ? tournament.format.overs * 6 : 12;

  // Add runs
  const addRuns = (runs) => {
    if (!tournament) return;

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
      if (team.wickets >= 10) {
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

  // Save match
  const saveMatch = () => {
    if (!tournament || !match) return;

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
          }
        : m
    );

    saveCricketTournament({
      ...tournament,
      matches: updatedMatches,
    });

    navigate(`/cricket/tournament/${id}`);
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
  const isInningsComplete = currentScore.balls >= totalBalls || currentScore.wickets >= 10;
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
            style={{ opacity: history.length === 0 ? 0.4 : 1 }}
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
