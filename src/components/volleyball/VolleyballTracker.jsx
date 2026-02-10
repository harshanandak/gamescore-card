import React, { useState, useEffect } from 'react';
import { saveVolleyballTournament, loadVolleyballTournaments, deleteVolleyballTournament } from '../../utils/storage';
import TeamManager from '../shared/TeamManager';

const createDefaultTeams = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    name: `Team ${i + 1}`,
    members: []
  }));
};

const generateMatches = (teamCount) => {
  const matches = [];
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      matches.push({
        id: Date.now() + matches.length,
        team1: i,
        team2: j,
        score1: null,
        score2: null
      });
    }
  }
  return matches;
};

const VolleyballTracker = React.memo(function VolleyballTracker({ onBack, mode = 'tournament' }) {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [editingTournamentName, setEditingTournamentName] = useState(false);
  const [tempTournamentName, setTempTournamentName] = useState('');

  // Match editing state
  const [editingMatch, setEditingMatch] = useState(null);
  const [tempScore1, setTempScore1] = useState('');
  const [tempScore2, setTempScore2] = useState('');

  // Load tournaments on mount
  useEffect(() => {
    const loaded = loadVolleyballTournaments();
    setTournaments(loaded);
  }, []);

  // Auto-save current tournament
  useEffect(() => {
    if (currentTournament) {
      saveVolleyballTournament(currentTournament);
      setTournaments(prev => {
        const idx = prev.findIndex(t => t.id === currentTournament.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = currentTournament;
          return updated;
        }
        return [...prev, currentTournament];
      });
    }
  }, [currentTournament]);

  const createNewTournament = () => {
    const teams = createDefaultTeams(5);
    const newTournament = {
      id: Date.now(),
      name: `Volleyball Tournament ${tournaments.length + 1}`,
      teams: teams,
      matches: generateMatches(teams.length),
      createdAt: new Date().toISOString(),
      mode: mode
    };
    setCurrentTournament(newTournament);
  };

  const selectTournament = (tournament) => {
    setCurrentTournament(tournament);
  };

  const deleteTournamentHandler = (tournamentId) => {
    if (confirm('Delete this tournament?')) {
      deleteVolleyballTournament(tournamentId);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(null);
      }
    }
  };

  const updateTeams = (newTeams) => {
    // Regenerate matches if team count changed
    const needsNewMatches = newTeams.length !== currentTournament.teams.length;
    setCurrentTournament(prev => ({
      ...prev,
      teams: newTeams,
      matches: needsNewMatches ? generateMatches(newTeams.length) : prev.matches
    }));
  };

  const updateTournamentName = () => {
    if (tempTournamentName.trim()) {
      setCurrentTournament(prev => ({ ...prev, name: tempTournamentName.trim() }));
    }
    setEditingTournamentName(false);
  };

  const startEditMatch = (index) => {
    setEditingMatch(index);
    const match = currentTournament.matches[index];
    setTempScore1(match.score1 !== null ? match.score1.toString() : '');
    setTempScore2(match.score2 !== null ? match.score2.toString() : '');
  };

  const validateAndSave = () => {
    const s1 = Number.parseInt(tempScore1, 10);
    const s2 = Number.parseInt(tempScore2, 10);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return;

    // Volleyball rules: winner needs at least 10, and more points than opponent
    const maxScore = Math.max(s1, s2);
    const minScore = Math.min(s1, s2);
    if (maxScore < 10) return;
    if (s1 === s2) return;
    // Deuce: if both reach 10+, winner needs 11
    if (minScore >= 10 && maxScore < 11) return;

    setCurrentTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, idx) =>
        idx === editingMatch ? { ...m, score1: s1, score2: s2 } : m
      )
    }));
    setEditingMatch(null);
  };

  const clearMatch = (index) => {
    setCurrentTournament(prev => ({
      ...prev,
      matches: prev.matches.map((m, idx) =>
        idx === index ? { ...m, score1: null, score2: null } : m
      )
    }));
    setEditingMatch(null);
  };

  const getStandings = () => {
    if (!currentTournament) return [];

    const stats = currentTournament.teams.map((team, idx) => ({
      name: team.name,
      idx,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0
    }));

    currentTournament.matches.forEach(m => {
      if (m.score1 !== null && m.score2 !== null) {
        if (stats[m.team1] && stats[m.team2]) {
          stats[m.team1].played++;
          stats[m.team2].played++;
          stats[m.team1].pointsFor += m.score1;
          stats[m.team1].pointsAgainst += m.score2;
          stats[m.team2].pointsFor += m.score2;
          stats[m.team2].pointsAgainst += m.score1;
          if (m.score1 > m.score2) {
            stats[m.team1].won++;
            stats[m.team2].lost++;
          } else {
            stats[m.team2].won++;
            stats[m.team1].lost++;
          }
        }
      }
    });

    return stats.sort((a, b) => {
      if (b.won !== a.won) return b.won - a.won;
      return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    });
  };

  // Tournament List View
  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 md:p-5">
          <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="text-white/80 hover:text-white mb-2 text-sm">← Back</button>
            <h1 className="text-xl md:text-2xl font-bold">🏐 Volleyball {mode === 'tournament' ? 'Tournament' : 'Quick Match'}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={createNewTournament}
            className="w-full p-4 mb-4 bg-orange-600 hover:bg-orange-500 rounded-xl font-semibold transition-colors"
          >
            + Create New Tournament
          </button>

          {tournaments.filter(t => t.mode === mode || (!t.mode && mode === 'tournament')).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🏐</div>
              <p>No tournaments yet</p>
              <p className="text-sm">Create one to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournaments.filter(t => t.mode === mode || (!t.mode && mode === 'tournament')).map(tournament => (
                <div key={tournament.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="cursor-pointer flex-1" onClick={() => selectTournament(tournament)}>
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {tournament.teams?.length || 0} teams • {tournament.matches?.filter(m => m.score1 !== null).length || 0}/{tournament.matches?.length || 0} matches
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTournamentHandler(tournament.id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const standings = getStandings();
  const completedCount = currentTournament.matches.filter(m => m.score1 !== null).length;
  const totalMatches = currentTournament.matches.length;

  // Tournament View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 md:p-5">
        <div className="max-w-lg mx-auto">
          <button onClick={() => setCurrentTournament(null)} className="text-white/80 hover:text-white mb-2 text-sm">← Back to List</button>

          {editingTournamentName ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={tempTournamentName}
                onChange={(e) => setTempTournamentName(e.target.value)}
                className="flex-1 p-2 bg-white/20 rounded-lg border border-white/30 text-white placeholder-white/50 outline-none text-sm"
                autoFocus
              />
              <button onClick={updateTournamentName} className="bg-white/20 px-3 py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setEditingTournamentName(false)} className="bg-white/10 px-3 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          ) : (
            <h1
              onClick={() => { setEditingTournamentName(true); setTempTournamentName(currentTournament.name); }}
              className="text-lg md:text-xl font-bold cursor-pointer hover:underline"
            >
              {currentTournament.name} ✏️
            </h1>
          )}

          <p className="text-orange-100 text-sm mt-1">Round Robin | First to 10 (11 at deuce)</p>
          <div className="mt-2 bg-black/20 rounded-full px-3 py-1 inline-block">
            <span className="text-sm font-medium">{completedCount}/{totalMatches} matches played</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto">
        <div className="flex bg-gray-900 border-b border-gray-800">
          {['matches', 'standings', 'teams'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'text-orange-400 border-b-2 border-orange-400'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'matches' ? 'Matches' : tab === 'standings' ? 'Table' : 'Teams'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {currentTournament.matches.map((match, idx) => {
              const team1 = currentTournament.teams[match.team1];
              const team2 = currentTournament.teams[match.team2];
              if (!team1 || !team2) return null;

              const isComplete = match.score1 !== null;
              const t1Wins = isComplete && match.score1 > match.score2;
              const t2Wins = isComplete && match.score2 > match.score1;

              return (
                <div key={match.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 border-b border-gray-700">
                    <span className="text-xs text-gray-500 font-medium">Match {idx + 1}</span>
                    {isComplete && (
                      <button
                        onClick={() => clearMatch(idx)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {editingMatch === idx ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="flex-1 text-right font-medium text-sm truncate">{team1.name}</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={tempScore1}
                          onChange={e => setTempScore1(e.target.value)}
                          className="w-14 md:w-16 text-center p-2 bg-gray-700 rounded-lg text-lg font-bold border border-gray-600 focus:border-orange-400 outline-none"
                          autoFocus
                        />
                        <span className="text-gray-500 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={tempScore2}
                          onChange={e => setTempScore2(e.target.value)}
                          className="w-14 md:w-16 text-center p-2 bg-gray-700 rounded-lg text-lg font-bold border border-gray-600 focus:border-orange-400 outline-none"
                        />
                        <span className="flex-1 font-medium text-sm truncate">{team2.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={validateAndSave}
                          className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingMatch(null)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">Winner needs 10+ pts (11 at deuce)</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditMatch(idx)}
                      className="p-4 flex items-center cursor-pointer hover:bg-gray-750 transition-colors"
                    >
                      <span className={`flex-1 text-right font-medium text-sm truncate ${t1Wins ? 'text-green-400' : t2Wins ? 'text-red-400' : ''}`}>
                        {team1.name}
                      </span>
                      <div className="mx-2 md:mx-4 min-w-[60px] md:min-w-[80px] text-center">
                        {isComplete ? (
                          <span className="text-xl md:text-2xl font-bold tracking-wider">
                            <span className={t1Wins ? 'text-green-400' : 'text-red-400'}>{match.score1}</span>
                            <span className="text-gray-600 mx-1">-</span>
                            <span className={t2Wins ? 'text-green-400' : 'text-red-400'}>{match.score2}</span>
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">vs</span>
                        )}
                      </div>
                      <span className={`flex-1 font-medium text-sm truncate ${t2Wins ? 'text-green-400' : t1Wins ? 'text-red-400' : ''}`}>
                        {team2.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/80 text-gray-400">
                    <th className="text-left py-3 px-2 md:px-3">#</th>
                    <th className="text-left py-3 px-1">Team</th>
                    <th className="text-center py-3 px-1 md:px-2">P</th>
                    <th className="text-center py-3 px-1 md:px-2">W</th>
                    <th className="text-center py-3 px-1 md:px-2">L</th>
                    <th className="text-center py-3 px-1 md:px-2">PF</th>
                    <th className="text-center py-3 px-1 md:px-2">PA</th>
                    <th className="text-center py-3 px-2 md:px-3">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, idx) => (
                    <tr key={team.idx} className={`border-t border-gray-700/50 ${idx === 0 && team.won > 0 ? 'bg-orange-500/10' : ''}`}>
                      <td className="py-3 px-2 md:px-3">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-orange-500/30 text-orange-300' : 'text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-1 font-medium truncate max-w-[80px] md:max-w-none">{team.name}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-gray-400">{team.played}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-green-400 font-semibold">{team.won}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-red-400">{team.lost}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-gray-300">{team.pointsFor}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-gray-400">{team.pointsAgainst}</td>
                      <td className="text-center py-3 px-2 md:px-3">
                        <span className={team.pointsFor - team.pointsAgainst >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {team.pointsFor - team.pointsAgainst >= 0 ? '+' : ''}{team.pointsFor - team.pointsAgainst}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            <div className="bg-yellow-900/30 border border-yellow-800/50 rounded-xl p-3 mb-4 text-sm text-yellow-200/80">
              Note: Adding or removing teams will regenerate all matches.
            </div>
            <TeamManager
              teams={currentTournament.teams}
              onUpdateTeams={updateTeams}
              maxTeams={10}
              minTeams={2}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default VolleyballTracker;
