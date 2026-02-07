import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadVolleyballTournaments, saveVolleyballTournament } from '../../utils/storage';
import { calculateVolleyballStandings, validateSingleSetScore } from '../../utils/volleyballCalculations';

export default function MonoVolleyballTournament() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('matches');
  const [visible, setVisible] = useState(false);
  const [scoringMatch, setScoringMatch] = useState(null);
  const [tempScore1, setTempScore1] = useState('');
  const [tempScore2, setTempScore2] = useState('');
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    const tournaments = loadVolleyballTournaments();
    const found = tournaments.find(t => t.id === Number(id) || t.id === id);
    if (found) setTournament(found);
    requestAnimationFrame(() => setVisible(true));
  }, [id]);

  useEffect(() => {
    if (tournament) saveVolleyballTournament(tournament);
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Tournament not found</p>
      </div>
    );
  }

  const getTeamName = (teamId) => {
    // Support both old format (index) and new format (string id)
    if (typeof teamId === 'number') {
      return tournament.teams[teamId]?.name || 'Unknown';
    }
    const team = tournament.teams.find(t => t.id === teamId);
    return team?.name || 'Unknown';
  };

  const getTeamId = (match, teamKey) => {
    // Handle both old (team1/team2 as index) and new (team1Id/team2Id) formats
    return match[`${teamKey}Id`] ?? match[teamKey];
  };

  const target = tournament.format?.target || 10;
  const completedMatches = tournament.matches.filter(m =>
    (m.score1 !== null && m.score1 !== undefined) || m.status === 'completed'
  ).length;
  const totalMatches = tournament.matches.length;

  // Build standings supporting both data formats
  const standings = (() => {
    const stats = tournament.teams.map((team, idx) => ({
      teamId: team.id || idx,
      teamName: team.name,
      played: 0, won: 0, lost: 0,
      pointsFor: 0, pointsAgainst: 0, diff: 0, matchPoints: 0,
    }));

    tournament.matches.forEach(match => {
      const s1 = match.score1 ?? (match.team1Score?.runs ?? null);
      const s2 = match.score2 ?? (match.team2Score?.runs ?? null);
      if (s1 === null || s2 === null) return;

      const t1Key = match.team1Id ?? match.team1;
      const t2Key = match.team2Id ?? match.team2;

      const t1 = stats.find(s => s.teamId === t1Key);
      const t2 = stats.find(s => s.teamId === t2Key);
      if (!t1 || !t2) return;

      t1.played++; t2.played++;
      t1.pointsFor += s1; t1.pointsAgainst += s2;
      t2.pointsFor += s2; t2.pointsAgainst += s1;

      if (s1 > s2) { t1.won++; t1.matchPoints += 2; t2.lost++; }
      else { t2.won++; t2.matchPoints += 2; t1.lost++; }
    });

    stats.forEach(s => { s.diff = s.pointsFor - s.pointsAgainst; });
    return stats.sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      return b.diff - a.diff;
    });
  })();

  const openScoring = (index) => {
    setScoringMatch(index);
    const match = tournament.matches[index];
    setTempScore1(match.score1 !== null ? match.score1.toString() : '');
    setTempScore2(match.score2 !== null ? match.score2.toString() : '');
    setScoreError('');
  };

  const saveScore = () => {
    const s1 = parseInt(tempScore1);
    const s2 = parseInt(tempScore2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      setScoreError('Enter valid scores');
      return;
    }
    if (!validateSingleSetScore(s1, s2, target)) {
      setScoreError(`Winner needs ${target}+ pts, win by 2 at deuce`);
      return;
    }

    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) =>
        i === scoringMatch ? { ...m, score1: s1, score2: s2, status: 'completed' } : m
      ),
    }));
    setScoringMatch(null);
  };

  const clearScore = (index) => {
    setTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, i) =>
        i === index ? { ...m, score1: null, score2: null, status: 'pending' } : m
      ),
    }));
  };

  const tabs = [
    { id: 'matches', label: 'Matches' },
    { id: 'table', label: 'Standings' },
    { id: 'teams', label: 'Teams' },
  ];

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate('/volleyball/tournament')}
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
          First to {target} &middot; {tournament.teams.length} teams &middot; Round Robin
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
              const t1Key = match.team1Id ?? match.team1;
              const t2Key = match.team2Id ?? match.team2;
              const t1Name = getTeamName(t1Key);
              const t2Name = getTeamName(t2Key);
              const isComplete = match.score1 !== null && match.score1 !== undefined;
              const t1Wins = isComplete && match.score1 > match.score2;
              const t2Wins = isComplete && match.score2 > match.score1;

              return (
                <div key={match.id} className="mono-card" style={{ padding: 0 }}>
                  <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #eee' }}>
                    <span className="text-xs font-mono" style={{ color: '#bbb' }}>Match {idx + 1}</span>
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

                  {scoringMatch === idx ? (
                    <div style={{ padding: '16px 20px' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="flex-1 text-right text-sm font-medium" style={{ color: '#111' }}>
                          {t1Name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="mono-input"
                          style={{ width: '60px', textAlign: 'center', fontSize: '1.125rem', fontWeight: 700 }}
                          value={tempScore1}
                          onChange={e => { setTempScore1(e.target.value); setScoreError(''); }}
                          autoFocus
                        />
                        <span style={{ color: '#ccc' }}>:</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          className="mono-input"
                          style={{ width: '60px', textAlign: 'center', fontSize: '1.125rem', fontWeight: 700 }}
                          value={tempScore2}
                          onChange={e => { setTempScore2(e.target.value); setScoreError(''); }}
                        />
                        <span className="flex-1 text-sm font-medium" style={{ color: '#111' }}>
                          {t2Name}
                        </span>
                      </div>
                      {scoreError && (
                        <p className="text-xs mb-3 text-center" style={{ color: '#dc2626' }}>{scoreError}</p>
                      )}
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
                      onClick={() => openScoring(idx)}
                      className="cursor-pointer"
                      style={{ padding: '16px 20px' }}
                    >
                      <div className="flex items-center">
                        <span className="flex-1 text-right text-sm font-medium" style={{ color: t1Wins ? '#111' : isComplete ? '#bbb' : '#111' }}>
                          {t1Name}
                        </span>
                        <div className="mx-4 text-center" style={{ minWidth: '60px' }}>
                          {isComplete ? (
                            <span className="text-lg font-bold font-mono mono-score">
                              <span style={{ color: t1Wins ? '#111' : '#bbb' }}>{match.score1}</span>
                              <span style={{ color: '#ddd' }}> - </span>
                              <span style={{ color: t2Wins ? '#111' : '#bbb' }}>{match.score2}</span>
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: '#ccc' }}>vs</span>
                          )}
                        </div>
                        <span className="flex-1 text-sm font-medium" style={{ color: t2Wins ? '#111' : isComplete ? '#bbb' : '#111' }}>
                          {t2Name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Standings */}
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
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>PF</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 6px' }}>PA</th>
                    <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 16px 12px 6px' }}>+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, idx) => (
                    <tr key={row.teamId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td className="font-mono" style={{ color: '#bbb', padding: '12px 12px 12px 16px' }}>{idx + 1}</td>
                      <td className="font-medium" style={{ color: '#111', padding: '12px 8px' }}>{row.teamName}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.played}</td>
                      <td className="text-center font-mono font-medium" style={{ color: '#111', padding: '12px 6px' }}>{row.won}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.lost}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.pointsFor}</td>
                      <td className="text-center font-mono" style={{ color: '#888', padding: '12px 6px' }}>{row.pointsAgainst}</td>
                      <td className="text-center font-mono" style={{
                        color: row.diff > 0 ? '#16a34a' : row.diff < 0 ? '#dc2626' : '#888',
                        padding: '12px 16px 12px 6px',
                      }}>
                        {row.diff > 0 ? '+' : ''}{row.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams */}
        {tab === 'teams' && (
          <div className="flex flex-col gap-3">
            {tournament.teams.map((team, i) => {
              const row = standings.find(r => r.teamId === (team.id || i));
              return (
                <div key={team.id || i} className="mono-card" style={{ padding: '16px 20px' }}>
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
                          {row.matchPoints} pts
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
