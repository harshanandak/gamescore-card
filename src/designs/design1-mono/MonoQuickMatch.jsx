import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OVERS_PRESETS, ballsToOvers, calculateRunRate } from '../../utils/cricketCalculations';
import { POINTS_PRESETS, validateSingleSetScore } from '../../utils/volleyballCalculations';
import { saveData, loadData } from '../../utils/storage';

const QM_KEY = 'gamescore_quickmatches';

function saveQuickMatch(match) {
  const all = loadData(QM_KEY, []);
  all.unshift(match);
  saveData(QM_KEY, all);
}

export default function MonoQuickMatch() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const isCricket = sport === 'cricket';

  const [phase, setPhase] = useState('setup'); // setup | scoring | result
  const [visible] = useState(true);

  // Setup state
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [format, setFormat] = useState(isCricket ? { overs: 5 } : { target: 10 });

  // Cricket scoring state
  const [battingTeam, setBattingTeam] = useState(1); // 1 or 2
  const [innings, setInnings] = useState(1); // 1 or 2
  const [scores, setScores] = useState({
    team1: { runs: 0, balls: 0, wickets: 0, allOut: false },
    team2: { runs: 0, balls: 0, wickets: 0, allOut: false },
  });

  // Volleyball scoring state
  const [vScore1, setVScore1] = useState(0);
  const [vScore2, setVScore2] = useState(0);

  // Result state
  const [result, setResult] = useState(null);

  const totalBalls = format.overs ? format.overs * 6 : 30;

  const startMatch = () => {
    if (!team1Name.trim() || !team2Name.trim()) return;
    setPhase('scoring');
  };

  // Cricket: Add runs
  const addRuns = (runs) => {
    const key = battingTeam === 1 ? 'team1' : 'team2';
    setScores(prev => {
      const team = { ...prev[key] };
      team.runs += runs;
      team.balls += 1;

      // Check if innings over
      if (team.balls >= totalBalls) {
        if (innings === 1) {
          setInnings(2);
          setBattingTeam(battingTeam === 1 ? 2 : 1);
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
    const key = battingTeam === 1 ? 'team1' : 'team2';
    setScores(prev => {
      const team = { ...prev[key] };
      team.wickets += 1;
      team.balls += 1;

      // 10 wickets = all out (for simplicity, or if balls done)
      if (team.wickets >= 10 || team.balls >= totalBalls) {
        team.allOut = team.wickets >= 10;
        if (innings === 1) {
          setInnings(2);
          setBattingTeam(battingTeam === 1 ? 2 : 1);
        } else {
          finishCricketMatch({ ...prev, [key]: team });
        }
      }

      return { ...prev, [key]: team };
    });
  };

  const addExtra = (type) => {
    const key = battingTeam === 1 ? 'team1' : 'team2';
    setScores(prev => ({
      ...prev,
      [key]: { ...prev[key], runs: prev[key].runs + 1 }, // wide/nb = +1, no ball consumed
    }));
  };

  const finishCricketMatch = (finalScores) => {
    const s = finalScores || scores;
    const winner = s.team1.runs > s.team2.runs ? team1Name
      : s.team2.runs > s.team1.runs ? team2Name
      : 'Tie';
    const r = {
      id: Date.now(),
      sport,
      team1: team1Name, team2: team2Name,
      team1Score: s.team1, team2Score: s.team2,
      winner, format,
      date: new Date().toISOString(),
    };
    setResult(r);
    saveQuickMatch(r);
    setPhase('result');
  };

  // Volleyball: Add point
  const addPoint = (team) => {
    const target = format.target;
    const newS1 = team === 1 ? vScore1 + 1 : vScore1;
    const newS2 = team === 2 ? vScore2 + 1 : vScore2;

    if (team === 1) setVScore1(newS1);
    else setVScore2(newS2);

    // Check win
    if (validateSingleSetScore(newS1, newS2, target)) {
      const winner = newS1 > newS2 ? team1Name : team2Name;
      const r = {
        id: Date.now(),
        sport,
        team1: team1Name, team2: team2Name,
        score1: newS1, score2: newS2,
        winner, format,
        date: new Date().toISOString(),
      };
      setResult(r);
      saveQuickMatch(r);
      setPhase('result');
    }
  };

  const endMatchManually = () => {
    if (isCricket) {
      finishCricketMatch(scores);
    } else {
      const winner = vScore1 > vScore2 ? team1Name
        : vScore2 > vScore1 ? team2Name
        : 'Tie';
      const r = {
        id: Date.now(), sport,
        team1: team1Name, team2: team2Name,
        score1: vScore1, score2: vScore2,
        winner, format, date: new Date().toISOString(),
      };
      setResult(r);
      saveQuickMatch(r);
      setPhase('result');
    }
  };

  const shareResult = () => {
    if (!result) return;
    let text;
    if (isCricket) {
      text = `${result.team1} ${result.team1Score.runs}/${result.team1Score.wickets} (${ballsToOvers(result.team1Score.balls)} ov) vs ${result.team2} ${result.team2Score.runs}/${result.team2Score.wickets} (${ballsToOvers(result.team2Score.balls)} ov) \u2014 ${result.winner === 'Tie' ? 'Match Tied' : `${result.winner} won`}`;
    } else {
      text = `${result.team1} ${result.score1} - ${result.score2} ${result.team2} \u2014 ${result.winner === 'Tie' ? 'Match Tied' : `${result.winner} won`}`;
    }
    navigator.clipboard?.writeText(text);
  };

  // === SETUP PHASE ===
  if (phase === 'setup') {
    return (
      <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate('/')} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#888' }}>
              \u2190 Home
            </button>
          </div>

          <h1 className="text-xl font-semibold tracking-tight mb-8" style={{ color: '#111' }}>
            {isCricket ? '\u{1F3CF}' : '\u{1F3D0}'} Quick Match
          </h1>

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

          <div className="mb-8">
            <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
              {isCricket ? 'Overs' : 'Points to win'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(isCricket ? OVERS_PRESETS : POINTS_PRESETS).map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setFormat(isCricket ? { overs: preset.value } : { target: preset.value })}
                  className={
                    (isCricket ? format.overs === preset.value : format.target === preset.value)
                      ? 'mono-btn-primary' : 'mono-btn'
                  }
                  style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

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
                {ballsToOvers(currentScore.balls)} ov &middot; RR: {currentScore.balls > 0 ? calculateRunRate(currentScore.runs, currentScore.balls).toFixed(2) : '0.00'}
              </p>
              {target !== null && (
                <p className="text-sm mt-2" style={{ color: '#0066ff' }}>
                  Target: {target + 1} &middot; Need {Math.max(0, target + 1 - currentScore.runs)} from {totalBalls - currentScore.balls} balls
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
                  style={{ width: '56px', height: '56px', fontSize: '1.25rem', fontWeight: 700, padding: 0 }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center mb-4">
              <button onClick={() => addExtra('wide')} className="mono-btn" style={{ padding: '10px 16px', fontSize: '0.8125rem' }}>
                Wide
              </button>
              <button onClick={() => addExtra('noBall')} className="mono-btn" style={{ padding: '10px 16px', fontSize: '0.8125rem' }}>
                No Ball
              </button>
            </div>

            <button
              onClick={addWicket}
              className="mono-btn w-full"
              style={{ padding: '14px', fontSize: '0.9375rem', borderColor: '#dc2626', color: '#dc2626' }}
            >
              Wicket
            </button>
          </div>
        </div>
      );
    }

    // Volleyball scoring
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={endMatchManually} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#dc2626' }}>
              End Match
            </button>
            <span className="mono-badge mono-badge-live">
              First to {format.target}
            </span>
          </div>

          <div className="flex items-stretch gap-4 mb-8" style={{ minHeight: '250px' }}>
            {/* Team 1 */}
            <div
              className="flex-1 flex flex-col items-center justify-center cursor-pointer mono-card"
              onClick={() => addPoint(1)}
              style={{ padding: '24px 16px' }}
            >
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
                {team1Name}
              </p>
              <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {vScore1}
              </p>
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>Tap to score</p>
            </div>

            {/* Team 2 */}
            <div
              className="flex-1 flex flex-col items-center justify-center cursor-pointer mono-card"
              onClick={() => addPoint(2)}
              style={{ padding: '24px 16px' }}
            >
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
                {team2Name}
              </p>
              <p className="text-6xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {vScore2}
              </p>
              <p className="text-xs mt-4" style={{ color: '#bbb' }}>Tap to score</p>
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: '#bbb' }}>
            {format.target} points to win &middot; Win by 2 at deuce
          </p>
        </div>
      </div>
    );
  }

  // === RESULT PHASE ===
  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10" style={{ paddingTop: '40px' }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#888' }}>
            Match Result
          </p>

          {result.winner !== 'Tie' ? (
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#111' }}>
                {result.winner} Won
              </h1>
              {isCricket && (
                <p className="text-sm" style={{ color: '#888' }}>
                  by {Math.abs(result.team1Score.runs - result.team2Score.runs)} runs
                </p>
              )}
            </>
          ) : (
            <h1 className="text-2xl font-bold" style={{ color: '#111' }}>Match Tied</h1>
          )}
        </div>

        {/* Scorecard */}
        <div className="mono-card mb-8" style={{ padding: '20px 24px' }}>
          {isCricket ? (
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
              <span className="text-sm font-medium" style={{ color: result.winner === result.team1 ? '#111' : '#888' }}>
                {result.team1}
              </span>
              <span className="text-2xl font-bold font-mono mono-score" style={{ color: '#111' }}>
                {result.score1} - {result.score2}
              </span>
              <span className="text-sm font-medium" style={{ color: result.winner === result.team2 ? '#111' : '#888' }}>
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
              setInnings(1);
              setBattingTeam(1);
              setResult(null);
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
