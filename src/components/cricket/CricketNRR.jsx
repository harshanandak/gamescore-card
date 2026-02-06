import React, { useState, useEffect } from 'react';
import { saveCricketTournament, loadCricketTournaments, deleteCricketTournament } from '../../utils/storage';
import TeamManager from '../shared/TeamManager';

const createDefaultTeams = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    name: `Team ${i + 1}`,
    members: []
  }));
};

export default function CricketNRR({ onBack, mode = 'tournament' }) {
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [editingTournamentName, setEditingTournamentName] = useState(false);
  const [tempTournamentName, setTempTournamentName] = useState('');

  // Match form state
  const [newMatch, setNewMatch] = useState({
    team1: '',
    team1Score: '',
    team1Balls: 12,
    team1AllOut: false,
    team2: '',
    team2Score: '',
    team2Balls: 12,
    team2AllOut: false
  });
  const [editingMatch, setEditingMatch] = useState(null);

  // Load tournaments on mount
  useEffect(() => {
    const loaded = loadCricketTournaments();
    setTournaments(loaded);
  }, []);

  // Auto-save current tournament
  useEffect(() => {
    if (currentTournament) {
      saveCricketTournament(currentTournament);
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
    const newTournament = {
      id: Date.now(),
      name: `Cricket Tournament ${tournaments.length + 1}`,
      teams: createDefaultTeams(5),
      matches: [],
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
      deleteCricketTournament(tournamentId);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      if (currentTournament?.id === tournamentId) {
        setCurrentTournament(null);
      }
    }
  };

  const updateTeams = (newTeams) => {
    setCurrentTournament(prev => ({ ...prev, teams: newTeams }));
  };

  const updateTournamentName = () => {
    if (tempTournamentName.trim()) {
      setCurrentTournament(prev => ({ ...prev, name: tempTournamentName.trim() }));
    }
    setEditingTournamentName(false);
  };

  const addMatch = () => {
    if (!newMatch.team1 || !newMatch.team2 || !newMatch.team1Score || !newMatch.team2Score) {
      alert('Please fill all match details');
      return;
    }

    const team1Score = parseInt(newMatch.team1Score);
    const team2Score = parseInt(newMatch.team2Score);
    const winner = team1Score > team2Score ? newMatch.team1 :
                   team2Score > team1Score ? newMatch.team2 : 'Tie';

    const match = {
      id: Date.now(),
      team1: newMatch.team1,
      team1Score,
      team1Balls: parseInt(newMatch.team1Balls),
      team1AllOut: newMatch.team1AllOut,
      team2: newMatch.team2,
      team2Score,
      team2Balls: parseInt(newMatch.team2Balls),
      team2AllOut: newMatch.team2AllOut,
      winner
    };

    setCurrentTournament(prev => ({
      ...prev,
      matches: [...prev.matches, match]
    }));

    setNewMatch({
      team1: '',
      team1Score: '',
      team1Balls: 12,
      team1AllOut: false,
      team2: '',
      team2Score: '',
      team2Balls: 12,
      team2AllOut: false
    });
  };

  const deleteMatch = (matchId) => {
    setCurrentTournament(prev => ({
      ...prev,
      matches: prev.matches.filter(m => m.id !== matchId)
    }));
  };

  const startEditMatch = (match) => {
    setEditingMatch({
      ...match,
      team1Score: match.team1Score.toString(),
      team2Score: match.team2Score.toString()
    });
  };

  const saveEditMatch = () => {
    if (!editingMatch.team1Score || !editingMatch.team2Score) return;

    const team1Score = parseInt(editingMatch.team1Score);
    const team2Score = parseInt(editingMatch.team2Score);
    const winner = team1Score > team2Score ? editingMatch.team1 :
                   team2Score > team1Score ? editingMatch.team2 : 'Tie';

    setCurrentTournament(prev => ({
      ...prev,
      matches: prev.matches.map(m =>
        m.id === editingMatch.id
          ? { ...editingMatch, team1Score, team2Score, team1Balls: parseInt(editingMatch.team1Balls), team2Balls: parseInt(editingMatch.team2Balls), winner }
          : m
      )
    }));
    setEditingMatch(null);
  };

  const calculatePointsTable = () => {
    if (!currentTournament) return [];

    const table = currentTournament.teams.map(team => ({
      team: team.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runsScored: 0,
      ballsFaced: 0,
      runsConceded: 0,
      ballsBowled: 0,
      nrr: 0
    }));

    currentTournament.matches.forEach(match => {
      const team1Data = table.find(t => t.team === match.team1);
      const team2Data = table.find(t => t.team === match.team2);

      if (!team1Data || !team2Data) return;

      team1Data.played++;
      team2Data.played++;

      team1Data.runsScored += match.team1Score;
      team1Data.ballsFaced += match.team1AllOut ? 12 : match.team1Balls;

      team2Data.runsScored += match.team2Score;
      team2Data.ballsFaced += match.team2AllOut ? 12 : match.team2Balls;

      team1Data.runsConceded += match.team2Score;
      team1Data.ballsBowled += match.team2AllOut ? 12 : match.team2Balls;

      team2Data.runsConceded += match.team1Score;
      team2Data.ballsBowled += match.team1AllOut ? 12 : match.team1Balls;

      if (match.winner === match.team1) {
        team1Data.won++;
        team1Data.points += 2;
        team2Data.lost++;
      } else if (match.winner === match.team2) {
        team2Data.won++;
        team2Data.points += 2;
        team1Data.lost++;
      } else {
        team1Data.tied++;
        team1Data.points += 1;
        team2Data.tied++;
        team2Data.points += 1;
      }
    });

    table.forEach(team => {
      if (team.ballsFaced > 0 && team.ballsBowled > 0) {
        const runRate = (team.runsScored * 6) / team.ballsFaced;
        const runRateAgainst = (team.runsConceded * 6) / team.ballsBowled;
        team.nrr = runRate - runRateAgainst;
      }
    });

    return table.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });
  };

  // Tournament List View
  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-5">
          <div className="max-w-4xl mx-auto">
            <button onClick={onBack} className="text-white/80 hover:text-white mb-2 text-sm">← Back</button>
            <h1 className="text-xl md:text-2xl font-bold">🏏 Cricket {mode === 'tournament' ? 'Tournament' : 'Quick Match'}</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={createNewTournament}
            className="w-full p-4 mb-4 bg-green-600 hover:bg-green-500 rounded-xl font-semibold transition-colors"
          >
            + Create New Tournament
          </button>

          {tournaments.filter(t => t.mode === mode || (!t.mode && mode === 'tournament')).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🏏</div>
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
                        {tournament.teams?.length || 0} teams • {tournament.matches?.length || 0} matches
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

  const pointsTable = calculatePointsTable();
  const teamNames = currentTournament.teams.map(t => t.name);

  // Tournament View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 md:p-5">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setCurrentTournament(null)} className="text-white/80 hover:text-white mb-2 text-sm">← Back to List</button>

          {editingTournamentName ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={tempTournamentName}
                onChange={(e) => setTempTournamentName(e.target.value)}
                className="flex-1 p-2 bg-white/20 rounded-lg border border-white/30 text-white placeholder-white/50 outline-none"
                autoFocus
              />
              <button onClick={updateTournamentName} className="bg-white/20 px-3 py-2 rounded-lg">Save</button>
              <button onClick={() => setEditingTournamentName(false)} className="bg-white/10 px-3 py-2 rounded-lg">Cancel</button>
            </div>
          ) : (
            <h1
              onClick={() => { setEditingTournamentName(true); setTempTournamentName(currentTournament.name); }}
              className="text-xl md:text-2xl font-bold cursor-pointer hover:underline"
            >
              {currentTournament.name} ✏️
            </h1>
          )}
          <p className="text-white/70 text-sm">{currentTournament.matches.length} matches played</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto">
        <div className="flex bg-gray-900 border-b border-gray-800 overflow-x-auto">
          {['matches', 'table', 'teams', 'add'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 text-xs md:text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                activeTab === tab ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'
              }`}
            >
              {tab === 'matches' ? 'Matches' : tab === 'table' ? 'Points Table' : tab === 'teams' ? 'Teams' : '+ Add Match'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Add Match Tab */}
        {activeTab === 'add' && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Add New Match</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Team 1 */}
              <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-green-400">Team 1</h3>
                <select
                  className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                  value={newMatch.team1}
                  onChange={(e) => setNewMatch({...newMatch, team1: e.target.value})}
                >
                  <option value="">Select Team</option>
                  {teamNames.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Score</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                      value={newMatch.team1Score}
                      onChange={(e) => setNewMatch({...newMatch, team1Score: e.target.value})}
                      placeholder="Runs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Balls</label>
                    <input
                      type="number"
                      max="12"
                      className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                      value={newMatch.team1Balls}
                      onChange={(e) => setNewMatch({...newMatch, team1Balls: e.target.value})}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newMatch.team1AllOut}
                    onChange={(e) => setNewMatch({...newMatch, team1AllOut: e.target.checked})}
                    className="rounded"
                  />
                  All Out
                </label>
              </div>

              {/* Team 2 */}
              <div className="space-y-3 p-3 bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-blue-400">Team 2</h3>
                <select
                  className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                  value={newMatch.team2}
                  onChange={(e) => setNewMatch({...newMatch, team2: e.target.value})}
                >
                  <option value="">Select Team</option>
                  {teamNames.filter(t => t !== newMatch.team1).map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Score</label>
                    <input
                      type="number"
                      className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                      value={newMatch.team2Score}
                      onChange={(e) => setNewMatch({...newMatch, team2Score: e.target.value})}
                      placeholder="Runs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Balls</label>
                    <input
                      type="number"
                      max="12"
                      className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                      value={newMatch.team2Balls}
                      onChange={(e) => setNewMatch({...newMatch, team2Balls: e.target.value})}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newMatch.team2AllOut}
                    onChange={(e) => setNewMatch({...newMatch, team2AllOut: e.target.checked})}
                    className="rounded"
                  />
                  All Out
                </label>
              </div>
            </div>

            <button
              onClick={addMatch}
              className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-semibold transition-colors"
            >
              Add Match
            </button>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div>
            {currentTournament.matches.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No matches yet</p>
                <button onClick={() => setActiveTab('add')} className="text-green-400 mt-2">+ Add first match</button>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTournament.matches.map(match => (
                  <div key={match.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    {editingMatch?.id === match.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-400">{editingMatch.team1}</label>
                            <input
                              type="number"
                              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                              value={editingMatch.team1Score}
                              onChange={(e) => setEditingMatch({...editingMatch, team1Score: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">{editingMatch.team2}</label>
                            <input
                              type="number"
                              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-white"
                              value={editingMatch.team2Score}
                              onChange={(e) => setEditingMatch({...editingMatch, team2Score: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEditMatch} className="flex-1 bg-green-600 py-2 rounded-lg">Save</button>
                          <button onClick={() => setEditingMatch(null)} className="flex-1 bg-gray-600 py-2 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${match.winner === match.team1 ? 'text-green-400' : ''}`}>
                                {match.team1}
                              </span>
                              <span className="text-xl font-bold text-green-400">{match.team1Score}</span>
                              <span className="text-gray-500 text-xs">({match.team1Balls}b{match.team1AllOut ? ', all out' : ''})</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              <span className={`font-medium ${match.winner === match.team2 ? 'text-green-400' : ''}`}>
                                {match.team2}
                              </span>
                              <span className="text-xl font-bold text-blue-400">{match.team2Score}</span>
                              <span className="text-gray-500 text-xs">({match.team2Balls}b{match.team2AllOut ? ', all out' : ''})</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => startEditMatch(match)} className="text-blue-400 text-sm px-2">Edit</button>
                            <button onClick={() => deleteMatch(match.id)} className="text-red-400 text-sm px-2">Delete</button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          Winner: <span className="text-green-400 font-medium">{match.winner}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Points Table Tab */}
        {activeTab === 'table' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700/50 text-gray-400">
                    <th className="text-left py-3 px-2 md:px-3">#</th>
                    <th className="text-left py-3 px-2">Team</th>
                    <th className="text-center py-3 px-1 md:px-2">P</th>
                    <th className="text-center py-3 px-1 md:px-2">W</th>
                    <th className="text-center py-3 px-1 md:px-2">L</th>
                    <th className="text-center py-3 px-1 md:px-2">T</th>
                    <th className="text-center py-3 px-1 md:px-2">Pts</th>
                    <th className="text-center py-3 px-2 md:px-3">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((team, idx) => (
                    <tr key={team.team} className={`border-t border-gray-700/50 ${idx === 0 && team.won > 0 ? 'bg-green-500/10' : ''}`}>
                      <td className="py-3 px-2 md:px-3 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-2 font-medium truncate max-w-[100px] md:max-w-none">{team.team}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-gray-400">{team.played}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-green-400">{team.won}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-red-400">{team.lost}</td>
                      <td className="text-center py-3 px-1 md:px-2 text-yellow-400">{team.tied}</td>
                      <td className="text-center py-3 px-1 md:px-2 font-bold">{team.points}</td>
                      <td className="text-center py-3 px-2 md:px-3">
                        <span className={team.nrr >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {team.nrr.toFixed(3)}
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
          <TeamManager
            teams={currentTournament.teams}
            onUpdateTeams={updateTeams}
            maxTeams={10}
            minTeams={2}
          />
        )}
      </div>

      {/* NRR Info */}
      {activeTab === 'table' && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="bg-green-900/30 p-4 rounded-xl border border-green-800/50 text-sm">
            <h3 className="font-semibold text-green-400 mb-2">Net Run Rate (NRR)</h3>
            <p className="text-green-200/70">
              NRR = (Runs Scored / Overs Batted) - (Runs Conceded / Overs Bowled)
            </p>
            <p className="text-green-200/70 mt-1">
              Teams all out are considered to have batted full allocation (12 balls = 2 overs).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
