import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadCricketTournaments, saveCricketTournament } from '../../utils/storage';
import { ballsToOvers, calculateCricketPointsTable } from '../../utils/cricketCalculations';

export default function MonoCricketTournament() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('matches');
  const [visible, setVisible] = useState(false);
  const [scoringMatch, setScoringMatch] = useState(null);
  const [scoreForm, setScoreForm] = useState({
    team1Runs: '', team1Balls: '', team1AllOut: false,
    team2Runs: '', team2Balls: '', team2AllOut: false,
  });

  useEffect(() => {
    const tournaments = loadCricketTournaments();
    const found = tournaments.find(t => t.id === Number(id) || t.id === id);
    if (found) setTournament(found);
    requestAnimationFrame(() => setVisible(true));
  }, [id]);

  useEffect(() => {
    if (tournament) saveCricketTournament(tournament);
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Tournament not found</p>
      </div>
    );
  }

  const getTeamName = (teamId) => {
    const team = tournament.teams.find(t => t.id === teamId);
    return team?.name || 'Unknown';
  };

  const totalBalls = tournament.format?.overs ? tournament.format.overs * 6 : 12;
  const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
  const totalMatches = tournament.matches.length;
  const pointsTable = calculateCricketPointsTable(tournament.teams, tournament.matches);

  const openScoring = (match, index) => {
    setScoringMatch(index);
    if (match.team1Score) {
      setScoreForm({
        team1Runs: match.team1Score.runs.toString(),
        team1Balls: match.team1Score.balls.toString(),
        team1AllOut: match.team1Score.allOut || false,
        team2Runs: match.team2Score.runs.toString(),
        team2Balls: match.team2Score.balls.toString(),
        team2AllOut: match.team2Score.allOut || false,
      });
    } else {
      setScoreForm({
        team1Runs: '', team1Balls: totalBalls.toString(), team1AllOut: false,
        team2Runs: '', team2Balls: totalBalls.toString(), team2AllOut: false,
      });
    }
  };

  const saveScore = () => {
    const t1r = parseInt(scoreForm.team1Runs);
    const t1b = parseInt(scoreForm.team1Balls);
    const t2r = parseInt(scoreForm.team2Runs);
    const t2b = parseInt(scoreForm.team2Balls);
    if (isNaN(t1r) || isNaN(t2r) || isNaN(t1b) || isNaN(t2b)) return;

    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) => {
        if (i !== scoringMatch) return m;
        return {
          ...m,
          team1Score: { runs: t1r, balls: t1b, allOut: scoreForm.team1AllOut },
          team2Score: { runs: t2r, balls: t2b, allOut: scoreForm.team2AllOut },
          status: 'completed',
        };
      }),
    }));
    setScoringMatch(null);
  };

  const clearScore = (index) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) => {
        if (i !== index) return m;
        return { ...m, team1Score: null, team2Score: null, status: 'pending' };
      }),
    }));
  };

  const tabs = [
    { id: 'matches', label: 'Matches' },
    { id: 'table', label: 'Points Table' },
    { id: 'teams', label: 'Teams' },
  ];

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate('/cricket/tournament')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            \u2190 Tournaments
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#111' }}>
            {tournament.name}
          </h1>
          <span className="mono-badge mono-badge-live">
            {completedMatches}/{totalMatches}
          </span>
        </div>

        <p className="text-xs mb-8" style={{ color: '#888' }}>
          {tournament.format?.overs || 2} overs &middot; {tournament.teams.length} teams &middot; Round Robin
        </p>

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid #eee' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="bg-transparent border-none cursor-pointer font-swiss px-4 py-3 text-sm"
              style={{
                color: tab === t.id ? '#0066ff' : '#888',
                borderBottom: tab === t.id ? '2px solid #0066ff' : '2px solid transparent',
                fontWeight: tab === t.id ? 500 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Matches */}
        {tab === 'matches' && (
          <div className="flex flex-col gap-3">
            {tournament.matches.map((match, idx) => {
              const isComplete = match.status === 'completed';
              const t1Name = getTeamName(match.team1Id);
              const t2Name = getTeamName(match.team2Id);
              const t1Wins = isComplete && match.team1Score.runs > match.team2Score.runs;
              const t2Wins = isComplete && match.team2Score.runs > match.team1Score.runs;

              return (
                <div key={match.id} className="mono-card" style={{ padding: 0 }}>
                  {/* Match header */}
                  <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #eee' }}>
                    <span className="text-xs font-mono" style={{ color: '#bbb' }}>
                      Match {idx + 1}
                    </span>
                    {isComplete && (
                      <button
                        onClick={() => clearScore(idx)}
                        className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                        style={{ color: '#dc2626' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Scoring overlay */}
                  {scoringMatch === idx ? (
                    <div style={{ padding: '16px 20px' }}>
                      {/* Team 1 */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2" style={{ color: '#111' }}>{t1Name}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs block mb-1" style={{ color: '#888' }}>Runs</label>
                            <input
                              type="number"
                              min="0"
                              className="mono-input"
                              value={scoreForm.team1Runs}
                              onChange={e => setScoreForm(p => ({ ...p, team1Runs: e.target.value }))}
                              autoFocus
                            />
                          </div>
                          <div style={{ width: '80px' }}>
                            <label className="text-xs block mb-1" style={{ color: '#888' }}>Balls</label>
                            <input
                              type="number"
                              min="1"
                              max={totalBalls}
                              className="mono-input"
                              value={scoreForm.team1Balls}
                              onChange={e => setScoreForm(p => ({ ...p, team1Balls: e.target.value }))}
                            />
                          </div>
                          <label className="flex items-center gap-1 text-xs mt-4" style={{ color: '#888' }}>
                            <input
                              type="checkbox"
                              checked={scoreForm.team1AllOut}
                              onChange={e => setScoreForm(p => ({ ...p, team1AllOut: e.target.checked }))}
                            />
                            All out
                          </label>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2" style={{ color: '#111' }}>{t2Name}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-xs block mb-1" style={{ color: '#888' }}>Runs</label>
                            <input
                              type="number"
                              min="0"
                              className="mono-input"
                              value={scoreForm.team2Runs}
                              onChange={e => setScoreForm(p => ({ ...p, team2Runs: e.target.value }))}
                            />
                          </div>
                          <div style={{ width: '80px' }}>
                            <label className="text-xs block mb-1" style={{ color: '#888' }}>Balls</label>
                            <input
                              type="number"
                              min="1"
                              max={totalBalls}
                              className="mono-input"
                              value={scoreForm.team2Balls}
                              onChange={e => setScoreForm(p => ({ ...p, team2Balls: e.target.value }))}
                            />
                          </div>
                          <label className="flex items-center gap-1 text-xs mt-4" style={{ color: '#888' }}>
                            <input
                              type="checkbox"
                              checked={scoreForm.team2AllOut}
                              onChange={e => setScoreForm(p => ({ ...p, team2AllOut: e.target.checked }))}
                            />
                            All out
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={saveScore} className="mono-btn-primary flex-1" style={{ padding: '10px' }}>
                          Save
                        </button>
                        <button onClick={() => setScoringMatch(null)} className="mono-btn flex-1" style={{ padding: '10px' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => openScoring(match, idx)}
                      className="cursor-pointer"
                      style={{ padding: '16px 20px' }}
                    >
                      {isComplete ? (
                        <div className="flex items-center">
                          <div className="flex-1 text-right">
                            <p className="text-sm font-medium" style={{ color: t1Wins ? '#111' : '#888' }}>
                              {t1Name}
                            </p>
                            <p className="text-lg font-bold font-mono mono-score" style={{ color: t1Wins ? '#111' : '#888' }}>
                              {match.team1Score.runs}/{match.team1Score.allOut ? 'all' : ''}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#bbb' }}>
                              {ballsToOvers(match.team1Score.balls)} ov
                            </p>
                          </div>
                          <div className="mx-4 text-xs" style={{ color: '#ccc' }}>vs</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: t2Wins ? '#111' : '#888' }}>
                              {t2Name}
                            </p>
                            <p className="text-lg font-bold font-mono mono-score" style={{ color: t2Wins ? '#111' : '#888' }}>
                              {match.team2Score.runs}/{match.team2Score.allOut ? 'all' : ''}
                            </p>
                            <p className="text-xs font-mono" style={{ color: '#bbb' }}>
                              {ballsToOvers(match.team2Score.balls)} ov
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: '#111' }}>{t1Name}</span>
                          <span className="text-xs" style={{ color: '#ccc' }}>vs</span>
                          <span className="text-sm" style={{ color: '#111' }}>{t2Name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Points Table */}
        {tab === 'table' && (
          <div className="mono-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th className="text-left font-normal" style={{ color: '#888', padding: '12px 12px 12px 16px' }}>#</th>
                    <th className="text-left font-normal" style={{ color: '#888', padding: '12px 8px' }}>Team</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>P</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>W</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>L</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>T</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>Pts</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 16px 12px 6px' }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((row, idx) => (
                    <tr key={row.teamId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td className="font-mono" style={{ color: '#bbb', padding: '12px 12px 12px 16px' }}>{idx + 1}</td>
                      <td className="font-medium" style={{ color: '#111', padding: '12px 8px' }}>{row.teamName}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.played}</td>
                      <td className="text-center font-mono font-medium" style={{ color: '#111', padding: '12px 6px' }}>{row.won}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.lost}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.tied}</td>
                      <td className="text-center font-mono font-bold" style={{ color: '#0066ff', padding: '12px 6px' }}>{row.points}</td>
                      <td className="text-center font-mono" style={{
                        color: row.nrr > 0 ? '#16a34a' : row.nrr < 0 ? '#dc2626' : '#888',
                        padding: '12px 16px 12px 6px',
                      }}>
                        {row.nrr > 0 ? '+' : ''}{row.nrr.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NRR Formula */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', background: '#fafafa' }}>
              <p className="text-xs" style={{ color: '#888' }}>
                NRR = (Runs Scored / Overs) - (Runs Conceded / Overs). All-out teams count full overs.
              </p>
            </div>
          </div>
        )}

        {/* Teams */}
        {tab === 'teams' && (
          <div className="flex flex-col gap-3">
            {tournament.teams.map((team, i) => {
              const row = pointsTable.find(r => r.teamId === team.id);
              return (
                <div key={team.id} className="mono-card" style={{ padding: '16px 20px' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: '#111' }}>{team.name}</h3>
                      {team.members?.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: '#888' }}>
                          {team.members.join(', ')}
                        </p>
                      )}
                    </div>
                    {row && (
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold" style={{ color: '#0066ff' }}>
                          {row.points} pts
                        </span>
                        <p className="text-xs font-mono" style={{ color: '#888' }}>
                          {row.won}W {row.lost}L
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
