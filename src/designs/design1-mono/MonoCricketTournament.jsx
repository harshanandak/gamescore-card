import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadCricketTournaments, saveCricketTournament } from '../../utils/storage';
import { ballsToOvers, calculateCricketPointsTable } from '../../utils/cricketCalculations';

export default function MonoCricketTournament() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('matches');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const tournaments = loadCricketTournaments();
    const found = tournaments.find(t => t.id === Number(id) || t.id === id);
    if (found) setTournament(found);
    requestAnimationFrame(() => setVisible(true));
  }, [id]);

  useEffect(() => {
    if (tournament) saveCricketTournament(tournament);
  }, [tournament]);

  // Memoize points table (must be before early returns to satisfy rules of hooks)
  const pointsTable = useMemo(
    () => {
      if (!tournament) return [];
      return calculateCricketPointsTable(tournament.teams, tournament.matches);
    },
    [tournament]
  );

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

  const completedMatches = tournament.matches.filter(m => m.status === 'completed').length;
  const totalMatches = tournament.matches.length;

  const clearScore = (matchId) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.id !== matchId) return m;
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
                        onClick={(e) => {
                          e.stopPropagation();
                          clearScore(match.id);
                        }}
                        className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                        style={{ color: '#dc2626' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Match card - clickable */}
                  <div
                    onClick={() => navigate(`/cricket/tournament/${id}/match/${match.id}/score`)}
                    className="cursor-pointer"
                    style={{
                      padding: '16px 20px',
                      background: match.status === 'in-progress' ? '#f0f9ff' : 'transparent',
                    }}
                  >
                    {isComplete ? (
                      <div className="flex items-center">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-medium" style={{ color: t1Wins ? '#111' : '#888' }}>
                            {t1Name}
                          </p>
                          <p className="text-lg font-bold font-mono mono-score" style={{ color: t1Wins ? '#111' : '#888' }}>
                            {match.team1Score.runs}/{match.team1Score.allOut ? 'all' : match.team1Score.wickets || 0}
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
                            {match.team2Score.runs}/{match.team2Score.allOut ? 'all' : match.team2Score.wickets || 0}
                          </p>
                          <p className="text-xs font-mono" style={{ color: '#bbb' }}>
                            {ballsToOvers(match.team2Score.balls)} ov
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: '#111' }}>{t1Name}</span>
                        {match.status === 'in-progress' ? (
                          <span className="text-xs font-medium" style={{ color: '#0066ff' }}>▶ Resume</span>
                        ) : (
                          <span className="text-xs" style={{ color: '#ccc' }}>vs</span>
                        )}
                        <span className="text-sm" style={{ color: '#111' }}>{t2Name}</span>
                      </div>
                    )}
                  </div>
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
                <div key={team.id} className="mono-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: '#111' }}>{team.name}</h3>
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

                  {/* Show roster if exists */}
                  {team.members && team.members.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#eee' }}>
                      <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#888' }}>
                        Roster
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.members.filter(m => m.trim()).map((member, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: '#f5f5f5', color: '#666' }}
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
