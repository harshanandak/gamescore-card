import React, { useState, useEffect } from 'react';
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
  const [scoringMatch, setScoringMatch] = useState(null);
  const [tempSets, setTempSets] = useState([]);
  const [scoreError, setScoreError] = useState('');

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
    m.sets && m.sets.length > 0 && m.status === 'completed'
  ).length;
  const totalMatches = tournament.matches.length;

  // Calculate standings
  const standings = calculateSetsStandings(tournament.teams, tournament.matches, sportConfig.config);

  const openScoring = (match) => {
    setScoringMatch(match);
    const existingSets = match.sets || [];
    setTempSets(existingSets.length > 0 ? existingSets : [{ score1: '', score2: '' }]);
    setScoreError('');
  };

  const closeScoring = () => {
    setScoringMatch(null);
    setTempSets([]);
    setScoreError('');
  };

  const validateSetScore = (score1, score2, setIndex) => {
    const s1 = Number(score1);
    const s2 = Number(score2);
    if (isNaN(s1) || isNaN(s2)) return { valid: false, error: 'Invalid score' };
    if (s1 < 0 || s2 < 0) return { valid: false, error: 'Scores must be positive' };

    const { pointsPerSet, deciderPoints, winBy, maxPoints } = sportConfig.config;
    const numSets = tournament.format?.sets || 3;
    const isDecider = setIndex === numSets - 1 && tempSets.length === numSets;
    const target = isDecider ? deciderPoints : pointsPerSet;

    const winner = Math.max(s1, s2);
    const loser = Math.min(s1, s2);

    // Must reach target
    if (winner < target) return { valid: false, error: `First to ${target}` };
    // Must win by N
    if (winner - loser < winBy) return { valid: false, error: `Win by ${winBy}` };
    // Cap if configured (badminton)
    if (maxPoints && winner > maxPoints) return { valid: false, error: `Max ${maxPoints}` };
    // No ties
    if (s1 === s2) return { valid: false, error: 'No ties' };

    return { valid: true };
  };

  const addSet = () => {
    const numSets = tournament.format?.sets || 3;
    if (tempSets.length >= numSets) {
      setScoreError(`Max ${numSets} sets`);
      return;
    }
    setTempSets([...tempSets, { score1: '', score2: '' }]);
  };

  const removeSet = (index) => {
    if (tempSets.length === 1) return;
    setTempSets(tempSets.filter((_, i) => i !== index));
  };

  const updateSetScore = (index, team, value) => {
    const newSets = [...tempSets];
    newSets[index] = { ...newSets[index], [team]: value };
    setTempSets(newSets);
    setScoreError('');
  };

  const saveScore = () => {
    // Validate all sets
    for (let i = 0; i < tempSets.length; i++) {
      const set = tempSets[i];
      if (!set.score1 || !set.score2) {
        setScoreError('Fill all set scores');
        return;
      }
      const validation = validateSetScore(set.score1, set.score2, i);
      if (!validation.valid) {
        setScoreError(`Set ${i + 1}: ${validation.error}`);
        return;
      }
    }

    // Count sets won
    let t1SetsWon = 0;
    let t2SetsWon = 0;
    tempSets.forEach(set => {
      const s1 = Number(set.score1);
      const s2 = Number(set.score2);
      if (s1 > s2) t1SetsWon++;
      else if (s2 > s1) t2SetsWon++;
    });

    // Update match
    const updatedMatches = tournament.matches.map(m => {
      if (m.id === scoringMatch.id) {
        return {
          ...m,
          sets: tempSets.map(s => ({ score1: Number(s.score1), score2: Number(s.score2) })),
          status: 'completed',
          winner: t1SetsWon > t2SetsWon ? m.team1Id : m.team2Id,
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
                        <div className="text-2xl font-mono font-bold mt-1">{t1SetsWon}</div>
                      )}
                    </div>
                    <div className="text-center text-xs" style={{ color: '#888' }}>
                      vs
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{getTeamName(match.team2Id)}</div>
                      {hasScore && (
                        <div className="text-2xl font-mono font-bold mt-1">{t2SetsWon}</div>
                      )}
                    </div>
                  </div>

                  {hasScore && (
                    <div className="text-xs space-y-1 mb-3" style={{ color: '#888' }}>
                      {match.sets.map((set, i) => (
                        <div key={i} className="flex justify-center gap-2">
                          <span>Set {i + 1}:</span>
                          <span className="font-mono">{set.score1}-{set.score2}</span>
                        </div>
                      ))}
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

      {/* Score Entry Modal */}
      {scoringMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Enter Set Scores</h2>

            <div className="text-sm mb-4" style={{ color: '#888' }}>
              {getTeamName(scoringMatch.team1Id)} vs {getTeamName(scoringMatch.team2Id)}
            </div>

            <div className="space-y-3 mb-4">
              {tempSets.map((set, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-12" style={{ color: '#888' }}>
                    Set {idx + 1}
                  </span>
                  <input
                    type="number"
                    value={set.score1}
                    onChange={(e) => updateSetScore(idx, 'score1', e.target.value)}
                    className="mono-input flex-1"
                    placeholder="0"
                    min="0"
                  />
                  <span style={{ color: '#888' }}>-</span>
                  <input
                    type="number"
                    value={set.score2}
                    onChange={(e) => updateSetScore(idx, 'score2', e.target.value)}
                    className="mono-input flex-1"
                    placeholder="0"
                    min="0"
                  />
                  {tempSets.length > 1 && (
                    <button
                      onClick={() => removeSet(idx)}
                      className="text-xs"
                      style={{ color: '#dc2626' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {scoreError && (
              <p className="text-xs mb-3" style={{ color: '#dc2626' }}>{scoreError}</p>
            )}

            <button
              onClick={addSet}
              className="mono-btn w-full mb-3"
            >
              + Add Set
            </button>

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
