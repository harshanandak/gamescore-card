import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadSportTournaments, saveSportTournament } from '../../utils/storage';
import { calculateGoalsStandings } from '../../utils/standingsCalculator';
import { getSportById } from '../../models/sportRegistry';

export default function GenericGoalsTournament() {
  const navigate = useNavigate();
  const { sport, id } = useParams();
  const sportConfig = getSportById(sport);

  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState('matches');
  const [visible, setVisible] = useState(false);
  const [scoringMatch, setScoringMatch] = useState(null);
  const [tempScore1, setTempScore1] = useState('');
  const [tempScore2, setTempScore2] = useState('');

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
    (m.score1 !== null && m.score1 !== undefined) && m.status === 'completed'
  ).length;
  const totalMatches = tournament.matches.length;

  // Calculate standings
  const standings = calculateGoalsStandings(tournament.teams, tournament.matches, sportConfig.config);

  const openScoring = (match) => {
    setScoringMatch(match);
    setTempScore1(match.score1 ?? '');
    setTempScore2(match.score2 ?? '');
  };

  const closeScoring = () => {
    setScoringMatch(null);
    setTempScore1('');
    setTempScore2('');
  };

  const quickAdd = (team, value) => {
    if (team === 1) {
      setTempScore1(prev => String(Number(prev || 0) + value));
    } else {
      setTempScore2(prev => String(Number(prev || 0) + value));
    }
  };

  const saveScore = () => {
    const s1 = Number(tempScore1);
    const s2 = Number(tempScore2);

    if (isNaN(s1) || isNaN(s2)) return;
    if (s1 < 0 || s2 < 0) return;

    // Check for draw if not allowed
    if (!sportConfig.config.drawAllowed && s1 === s2) {
      alert('Draws not allowed in this sport');
      return;
    }

    const updatedMatches = tournament.matches.map(m => {
      if (m.id === scoringMatch.id) {
        return {
          ...m,
          score1: s1,
          score2: s2,
          status: 'completed',
          winner: s1 > s2 ? m.team1Id : s2 > s1 ? m.team2Id : 'draw',
        };
      }
      return m;
    });

    setTournament({ ...tournament, matches: updatedMatches });
    closeScoring();
  };

  const deleteScore = (matchId) => {
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === matchId) {
        return { ...m, score1: null, score2: null, status: 'pending', winner: null };
      }
      return m;
    });
    setTournament({ ...tournament, matches: updatedMatches });
  };

  const quickButtons = sportConfig.config.quickButtons;

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
              const hasScore = match.score1 !== null && match.score1 !== undefined;

              return (
                <div key={match.id} className="mono-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono" style={{ color: '#888' }}>
                      MATCH {idx + 1}
                    </span>
                    {hasScore && (
                      <button
                        onClick={() => deleteScore(match.id)}
                        className="text-xs"
                        style={{ color: '#dc2626' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center mb-3">
                    <div className="text-right">
                      <div className="font-medium">{getTeamName(match.team1Id)}</div>
                      {hasScore && (
                        <div className="text-2xl font-mono font-bold mt-1">{match.score1}</div>
                      )}
                    </div>
                    <div className="text-center text-xs" style={{ color: '#888' }}>
                      vs
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{getTeamName(match.team2Id)}</div>
                      {hasScore && (
                        <div className="text-2xl font-mono font-bold mt-1">{match.score2}</div>
                      )}
                    </div>
                  </div>

                  {hasScore && match.winner === 'draw' && (
                    <div className="text-xs text-center mb-2" style={{ color: '#888' }}>
                      Draw
                    </div>
                  )}

                  <button
                    onClick={() => openScoring(match)}
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
                    {sportConfig.config.drawAllowed && (
                      <td className="py-3 text-center font-mono text-sm">{team.drawn}</td>
                    )}
                    <td className="py-3 text-center font-mono text-sm">{team.lost}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.goalsFor}</td>
                    <td className="py-3 text-center font-mono text-sm">{team.goalsAgainst}</td>
                    <td className="py-3 text-center font-mono text-sm font-bold"
                        style={{ color: team.goalDiff >= 0 ? '#059669' : '#dc2626' }}>
                      {team.goalDiff >= 0 ? '+' : ''}{team.goalDiff}
                    </td>
                    <td className="py-3 text-center font-mono text-sm font-bold">{team.points}</td>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                       style={{ background: '#f5f5f5' }}>
                    {idx + 1}
                  </div>
                  <div className="font-medium">{team.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Entry Modal */}
      {scoringMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Enter Score</h2>

            <div className="space-y-4 mb-4">
              {/* Team 1 */}
              <div>
                <div className="text-sm font-medium mb-2">{getTeamName(scoringMatch.team1Id)}</div>
                <input
                  type="number"
                  value={tempScore1}
                  onChange={(e) => setTempScore1(e.target.value)}
                  className="mono-input w-full mb-2"
                  placeholder="0"
                  min="0"
                />
                {quickButtons && (
                  <div className="flex gap-2 flex-wrap">
                    {quickButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => quickAdd(1, btn.value)}
                        className="mono-btn text-xs px-3 py-1"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div>
                <div className="text-sm font-medium mb-2">{getTeamName(scoringMatch.team2Id)}</div>
                <input
                  type="number"
                  value={tempScore2}
                  onChange={(e) => setTempScore2(e.target.value)}
                  className="mono-input w-full mb-2"
                  placeholder="0"
                  min="0"
                />
                {quickButtons && (
                  <div className="flex gap-2 flex-wrap">
                    {quickButtons.map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => quickAdd(2, btn.value)}
                        className="mono-btn text-xs px-3 py-1"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={closeScoring} className="mono-btn flex-1">
                Cancel
              </button>
              <button onClick={saveScore} className="mono-btn-primary flex-1">
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
