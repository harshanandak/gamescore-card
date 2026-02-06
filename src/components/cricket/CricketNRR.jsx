import React, { useState } from 'react';

export default function CricketNRR({ onBack }) {
  const [teams] = useState(['Dinesh', 'Harsha', 'Nitin', 'Vignesh', 'Pavan']);
  const [matches, setMatches] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [newMatch, setNewMatch] = useState({
    team1: '',
    team1Score: '',
    team1Balls: 12,
    team1AllOut: false,
    team2: '',
    team2Score: '',
    team2Balls: 12,
    team2AllOut: false,
    winner: ''
  });

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
      team1Score: team1Score,
      team1Balls: parseInt(newMatch.team1Balls),
      team1AllOut: newMatch.team1AllOut,
      team2: newMatch.team2,
      team2Score: team2Score,
      team2Balls: parseInt(newMatch.team2Balls),
      team2AllOut: newMatch.team2AllOut,
      winner: winner
    };

    setMatches([...matches, match]);
    setNewMatch({
      team1: '',
      team1Score: '',
      team1Balls: 12,
      team1AllOut: false,
      team2: '',
      team2Score: '',
      team2Balls: 12,
      team2AllOut: false,
      winner: ''
    });
  };

  const calculatePointsTable = () => {
    const table = teams.map(team => ({
      team,
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

    matches.forEach(match => {
      const team1Data = table.find(t => t.team === match.team1);
      const team2Data = table.find(t => t.team === match.team2);

      team1Data.played++;
      team2Data.played++;

      team1Data.runsScored += match.team1Score;
      if (match.team1AllOut) {
        team1Data.ballsFaced += 12;
      } else {
        team1Data.ballsFaced += match.team1Balls;
      }

      team2Data.runsScored += match.team2Score;
      if (match.team2AllOut) {
        team2Data.ballsFaced += 12;
      } else {
        team2Data.ballsFaced += match.team2Balls;
      }

      team1Data.runsConceded += match.team2Score;
      team2Data.runsConceded += match.team1Score;

      if (match.team2AllOut) {
        team1Data.ballsBowled += 12;
      } else {
        team1Data.ballsBowled += match.team2Balls;
      }

      if (match.team1AllOut) {
        team2Data.ballsBowled += 12;
      } else {
        team2Data.ballsBowled += match.team1Balls;
      }

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

  const pointsTable = calculatePointsTable();

  const deleteMatch = (matchId) => {
    setMatches(matches.filter(m => m.id !== matchId));
  };

  const startEditing = (match) => {
    setEditingMatch({
      id: match.id,
      team1: match.team1,
      team1Score: match.team1Score.toString(),
      team1Balls: match.team1Balls,
      team1AllOut: match.team1AllOut,
      team2: match.team2,
      team2Score: match.team2Score.toString(),
      team2Balls: match.team2Balls,
      team2AllOut: match.team2AllOut
    });
  };

  const saveEdit = () => {
    if (!editingMatch.team1Score || !editingMatch.team2Score) {
      alert('Please fill all scores');
      return;
    }

    const team1Score = parseInt(editingMatch.team1Score);
    const team2Score = parseInt(editingMatch.team2Score);
    const winner = team1Score > team2Score ? editingMatch.team1 :
                   team2Score > team1Score ? editingMatch.team2 : 'Tie';

    const updatedMatches = matches.map(match =>
      match.id === editingMatch.id
        ? {
            ...match,
            team1Score: team1Score,
            team1Balls: parseInt(editingMatch.team1Balls),
            team1AllOut: editingMatch.team1AllOut,
            team2Score: team2Score,
            team2Balls: parseInt(editingMatch.team2Balls),
            team2AllOut: editingMatch.team2AllOut,
            winner: winner
          }
        : match
    );

    setMatches(updatedMatches);
    setEditingMatch(null);
  };

  const cancelEdit = () => {
    setEditingMatch(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-center flex-1 text-blue-800">Cricket Tournament - NRR Calculator</h1>
      </div>

      {/* Add Match Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Match</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team 1</label>
            <select
              className="w-full p-2 border rounded-md"
              value={newMatch.team1}
              onChange={(e) => setNewMatch({...newMatch, team1: e.target.value})}
            >
              <option value="">Select Team</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Score</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={newMatch.team1Score}
              onChange={(e) => setNewMatch({...newMatch, team1Score: e.target.value})}
              placeholder="Runs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Balls Faced</label>
            <input
              type="number"
              max="12"
              className="w-full p-2 border rounded-md"
              value={newMatch.team1Balls}
              onChange={(e) => setNewMatch({...newMatch, team1Balls: e.target.value})}
            />
          </div>

          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              id="team1AllOut"
              checked={newMatch.team1AllOut}
              onChange={(e) => setNewMatch({...newMatch, team1AllOut: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="team1AllOut" className="text-sm">All Out</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Team 2</label>
            <select
              className="w-full p-2 border rounded-md"
              value={newMatch.team2}
              onChange={(e) => setNewMatch({...newMatch, team2: e.target.value})}
            >
              <option value="">Select Team</option>
              {teams.filter(team => team !== newMatch.team1).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Score</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={newMatch.team2Score}
              onChange={(e) => setNewMatch({...newMatch, team2Score: e.target.value})}
              placeholder="Runs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Balls Faced</label>
            <input
              type="number"
              max="12"
              className="w-full p-2 border rounded-md"
              value={newMatch.team2Balls}
              onChange={(e) => setNewMatch({...newMatch, team2Balls: e.target.value})}
            />
          </div>

          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              id="team2AllOut"
              checked={newMatch.team2AllOut}
              onChange={(e) => setNewMatch({...newMatch, team2AllOut: e.target.checked})}
              className="mr-2"
            />
            <label htmlFor="team2AllOut" className="text-sm">All Out</label>
          </div>
        </div>

        <button
          onClick={addMatch}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Match
        </button>
      </div>

      {/* Points Table */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Points Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border p-3 text-left">Position</th>
                <th className="border p-3 text-left">Team</th>
                <th className="border p-3 text-center">Played</th>
                <th className="border p-3 text-center">Won</th>
                <th className="border p-3 text-center">Lost</th>
                <th className="border p-3 text-center">Tied</th>
                <th className="border p-3 text-center">Points</th>
                <th className="border p-3 text-center">NRR</th>
              </tr>
            </thead>
            <tbody>
              {pointsTable.map((team, index) => (
                <tr key={team.team} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border p-3 font-semibold text-center">{index + 1}</td>
                  <td className="border p-3 font-medium">{team.team}</td>
                  <td className="border p-3 text-center">{team.played}</td>
                  <td className="border p-3 text-center text-green-600">{team.won}</td>
                  <td className="border p-3 text-center text-red-600">{team.lost}</td>
                  <td className="border p-3 text-center text-yellow-600">{team.tied}</td>
                  <td className="border p-3 text-center font-semibold">{team.points}</td>
                  <td className="border p-3 text-center">
                    <span className={team.nrr >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {team.nrr.toFixed(3)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Match Results</h2>
        {matches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No matches added yet</p>
        ) : (
          <div className="space-y-3">
            {matches.map(match => (
              <div key={match.id} className="bg-white border rounded-lg p-4 shadow-sm">
                {editingMatch && editingMatch.id === match.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">{editingMatch.team1}</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded-md"
                          value={editingMatch.team1Score}
                          onChange={(e) => setEditingMatch({...editingMatch, team1Score: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Balls</label>
                        <input
                          type="number"
                          max="12"
                          className="w-full p-2 border rounded-md"
                          value={editingMatch.team1Balls}
                          onChange={(e) => setEditingMatch({...editingMatch, team1Balls: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          checked={editingMatch.team1AllOut}
                          onChange={(e) => setEditingMatch({...editingMatch, team1AllOut: e.target.checked})}
                          className="mr-2"
                        />
                        <label className="text-sm">All Out</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">{editingMatch.team2}</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded-md"
                          value={editingMatch.team2Score}
                          onChange={(e) => setEditingMatch({...editingMatch, team2Score: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Balls</label>
                        <input
                          type="number"
                          max="12"
                          className="w-full p-2 border rounded-md"
                          value={editingMatch.team2Balls}
                          onChange={(e) => setEditingMatch({...editingMatch, team2Balls: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          checked={editingMatch.team2AllOut}
                          onChange={(e) => setEditingMatch({...editingMatch, team2AllOut: e.target.checked})}
                          className="mr-2"
                        />
                        <label className="text-sm">All Out</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="bg-green-600 text-white px-4 py-1 rounded-md hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 text-white px-4 py-1 rounded-md hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium">{match.team1}</span>
                      <span className="mx-2 text-lg font-bold text-blue-600">{match.team1Score}</span>
                      <span className="text-gray-500 text-sm">
                        ({match.team1Balls} balls{match.team1AllOut ? ', all out' : ''})
                      </span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span className="mx-2 text-lg font-bold text-blue-600">{match.team2Score}</span>
                      <span className="text-gray-500 text-sm">
                        ({match.team2Balls} balls{match.team2AllOut ? ', all out' : ''})
                      </span>
                      <span className="font-medium">{match.team2}</span>
                      <span className="ml-4 text-sm text-gray-600">
                        Winner: <span className="font-medium text-green-600">{match.winner}</span>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(match)}
                        className="text-blue-500 hover:text-blue-700 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMatch(match.id)}
                        className="text-red-500 hover:text-red-700 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NRR Explanation */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Net Run Rate (NRR) Explanation:</h3>
        <p className="text-sm text-blue-700">
          NRR = (Total Runs Scored / Total Overs Batted) - (Total Runs Conceded / Total Overs Bowled)
        </p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Key:</strong> If a team gets all out, they are considered to have batted their full allocation (2 overs = 12 balls).
          If a team chases successfully, they only batted for the balls they actually faced.
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Teams are ranked by Points first, then by NRR. Higher NRR is better.
        </p>
      </div>
    </div>
  );
}
