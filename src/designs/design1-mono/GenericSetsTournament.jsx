import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadSportTournaments, saveSportTournament } from '../../utils/storage';
import { calculateSetsStandings } from '../../utils/standingsCalculator';
import { getSportById } from '../../models/sportRegistry';

export default function GenericSetsTournament() {
  const navigate = useNavigate();
  const { sport, id } = useParams();
  const sportConfig = getSportById(sport);

  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('matches');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sportConfig) return;
    const tournaments = loadSportTournaments(sportConfig.storageKey);
    const found = tournaments.find(t => t.id === Number(id) || t.id === id);
    if (found) setTournament(found);
    requestAnimationFrame(() => setVisible(true));
  }, [id, sportConfig]);

  useEffect(() => {
    if (tournament && sportConfig) {
      saveSportTournament(sportConfig.storageKey, tournament);
    }
  }, [tournament, sportConfig]);

  // Calculate standings (must be before early returns to satisfy rules of hooks)
  const standings = useMemo(
    () => {
      if (!tournament || !sportConfig) return [];
      return calculateSetsStandings(tournament.teams, tournament.matches, sportConfig.config);
    },
    [tournament, sportConfig]
  );

  if (!sportConfig) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Sport not found</p>
      </div>
    );
  }

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

  const completedMatches = tournament.matches.filter(m =>
    m.sets && m.sets.length > 0 && m.status === 'completed'
  ).length;
  const totalMatches = tournament.matches.length;


  const deleteScore = (matchId) => {
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === matchId) {
        return { ...m, sets: [], status: 'pending', winner: null };
      }
      return m;
    });
    setTournament({ ...tournament, matches: updatedMatches });
  };

  return (
    <div className={`min-h-screen mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/${sport}/tournament`)}
            className="flex items-center gap-2 text-sm"
            style={{ color: '#888' }}
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <span className="mono-badge mono-badge-live">
            {completedMatches}/{totalMatches} Matches
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-sm mb-8" style={{ color: '#888' }}>
          {sportConfig.name} Tournament
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b" style={{ borderColor: '#eeeeee' }}>
          {['matches', 'standings', 'teams'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === t ? 'border-b-2' : ''
              }`}
              style={{
                color: tab === t ? '#0066ff' : '#888',
                borderColor: tab === t ? '#0066ff' : 'transparent',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Matches Tab */}
        {tab === 'matches' && (
          <div className="space-y-4">
            {tournament.matches.map((match, idx) => {
              const hasScore = match.sets && match.sets.length > 0;
              let t1SetsWon = 0;
              let t2SetsWon = 0;
              if (hasScore) {
                match.sets.forEach(set => {
                  if (set.score1 > set.score2) t1SetsWon++;
                  else if (set.score2 > set.score1) t2SetsWon++;
                });
              }

              // Determine winner and colors
              const isTeam1Winner = hasScore && t1SetsWon > t2SetsWon;
              const isTeam2Winner = hasScore && t2SetsWon > t1SetsWon;
              const team1Color = isTeam1Winner || !hasScore ? '#111' : '#888';
              const team2Color = isTeam2Winner || !hasScore ? '#111' : '#888';

              return (
                <div key={match.id} className="mono-card p-5">
                  {/* Header with match number and status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#aaa' }}>
                      Match {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasScore && match.status === 'completed' && (
                        <span className="mono-badge mono-badge-final">
                          Completed
                        </span>
                      )}
                      {hasScore && match.status !== 'completed' && (
                        <span className="mono-badge mono-badge-live">
                          In Progress
                        </span>
                      )}
                      {hasScore && (
                        <button
                          onClick={() => deleteScore(match.id)}
                          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: '#dc2626' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teams and scores */}
                  <div className="grid grid-cols-3 gap-6 items-center mb-5">
                    <div className="text-right">
                      <div className="text-base font-medium mb-1" style={{ color: team1Color }}>
                        {getTeamName(match.team1Id)}
                      </div>
                      {hasScore && (
                        <div className="text-3xl font-mono font-bold" style={{ color: team1Color }}>
                          {t1SetsWon}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium" style={{ color: '#bbb' }}>vs</div>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-medium mb-1" style={{ color: team2Color }}>
                        {getTeamName(match.team2Id)}
                      </div>
                      {hasScore && (
                        <div className="text-3xl font-mono font-bold" style={{ color: team2Color }}>
                          {t2SetsWon}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Set scores */}
                  {hasScore && (
                    <div className="flex justify-center gap-2 flex-wrap mb-5 py-3" style={{ borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                      {match.sets.map((set, i) => {
                        const setWinner = set.score1 > set.score2 ? 'team1' : 'team2';
                        const matchWinner = t1SetsWon > t2SetsWon ? 'team1' : 'team2';
                        const isMatchWinnerSet = setWinner === matchWinner;
                        return (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded font-mono"
                            style={{
                              background: isMatchWinnerSet ? '#dcfce7' : '#fee2e2',
                              color: '#111',
                              fontSize: '0.875rem'
                            }}
                          >
                            <span style={{ fontWeight: set.score1 > set.score2 ? '600' : 'normal' }}>{set.score1}</span>
                            <span style={{ color: '#ccc', margin: '0 4px', fontWeight: '300' }}>-</span>
                            <span style={{ fontWeight: set.score2 > set.score1 ? '600' : 'normal' }}>{set.score2}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => navigate(`/${sport}/tournament/${id}/match/${match.id}/score`)}
                    className="mono-btn w-full"
                  >
                    {hasScore ? 'Edit Score' : 'Enter Score'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Standings Tab */}
        {tab === 'standings' && (
          <div className="mono-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs" style={{ color: '#888' }}>
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Team</th>
                  {sportConfig.standingsColumns.map(col => (
                    <th key={col} className="text-center py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => (
                  <tr key={team.teamId} className="border-t" style={{ borderColor: '#eeeeee' }}>
                    <td className="py-3 font-mono text-xs" style={{ color: '#888' }}>{idx + 1}</td>
                    <td className="py-3 font-medium">{team.teamName}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.played}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.won}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.lost}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.setsWon}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.setsLost}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.pointsFor}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.pointsAgainst}</td>
                    <td className="py-3 text-center font-mono text-sm font-bold"
                        style={{ color: team.diff >= 0 ? '#059669' : '#dc2626' }}>
                      {team.diff >= 0 ? '+' : ''}{team.diff}
                    </td>
                    <td className="py-3 text-center font-mono text-sm font-bold">{team.matchPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div className="space-y-3">
            {tournament.teams.map((team, idx) => (
              <div key={team.id} className="mono-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                       style={{ background: '#f5f5f5' }}>
                    {idx + 1}
                  </div>
                  <div className="font-medium">{team.name}</div>
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
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
