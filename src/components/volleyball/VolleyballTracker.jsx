import React, { useState } from 'react';

export default function VolleyballTracker({ onBack }) {
  const [teams, setTeams] = useState(['Vignesh', 'Prabhas', 'Harsha', 'Nitin', 'Gaurav']);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [activeTab, setActiveTab] = useState('matches');

  // Generate matches with balanced rotation (no team plays back-to-back)
  const generateMatches = () => {
    const matchOrder = [
      [0, 1], [2, 3], [4, 0], [1, 2], [3, 4],
      [0, 2], [1, 3], [4, 2], [0, 3], [1, 4]
    ];
    return matchOrder.map(([t1, t2]) => ({
      team1: t1,
      team2: t2,
      score1: null,
      score2: null
    }));
  };

  const [matches, setMatches] = useState(generateMatches());
  const [editingMatch, setEditingMatch] = useState(null);
  const [tempScore1, setTempScore1] = useState('');
  const [tempScore2, setTempScore2] = useState('');

  const startEditTeam = (index) => {
    setEditingTeam(index);
    setEditName(teams[index]);
  };

  const saveTeamName = () => {
    if (editName.trim()) {
      const newTeams = [...teams];
      newTeams[editingTeam] = editName.trim();
      setTeams(newTeams);
    }
    setEditingTeam(null);
    setEditName('');
  };

  const startEditMatch = (index) => {
    setEditingMatch(index);
    setTempScore1(matches[index].score1 !== null ? matches[index].score1.toString() : '');
    setTempScore2(matches[index].score2 !== null ? matches[index].score2.toString() : '');
  };

  const validateAndSave = () => {
    const s1 = parseInt(tempScore1);
    const s2 = parseInt(tempScore2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return;

    // Validate: winner must have at least 10, and must win by having more points
    const maxScore = Math.max(s1, s2);
    const minScore = Math.min(s1, s2);
    if (maxScore < 10) return;
    if (s1 === s2) return;
    // If both reach 10+, winner needs 11 (deuce scenario)
    if (minScore >= 10 && maxScore < 11) return;

    const newMatches = [...matches];
    newMatches[editingMatch] = { ...newMatches[editingMatch], score1: s1, score2: s2 };
    setMatches(newMatches);
    setEditingMatch(null);
  };

  const clearMatch = (index) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], score1: null, score2: null };
    setMatches(newMatches);
    setEditingMatch(null);
  };

  const getStandings = () => {
    const stats = teams.map((name, idx) => ({
      name,
      idx,
      played: 0,
      won: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0
    }));

    matches.forEach(m => {
      if (m.score1 !== null && m.score2 !== null) {
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
    });

    return stats.sort((a, b) => {
      if (b.won !== a.won) return b.won - a.won;
      return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst);
    });
  };

  const completedCount = matches.filter(m => m.score1 !== null).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-5 text-center">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 text-white/80 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold tracking-wide">Volleyball League</h1>
        <p className="text-orange-100 text-sm mt-1">Round Robin | First to 10 (11 at deuce)</p>
        <div className="mt-3 bg-black/20 rounded-full px-4 py-1.5 inline-block">
          <span className="text-sm font-medium">{completedCount}/10 matches played</span>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="p-4">
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matches.map((match, idx) => {
              const isComplete = match.score1 !== null;
              const t1Wins = isComplete && match.score1 > match.score2;
              const t2Wins = isComplete && match.score2 > match.score1;

              return (
                <div key={idx} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
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
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-right font-medium text-sm">{teams[match.team1]}</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={tempScore1}
                          onChange={e => setTempScore1(e.target.value)}
                          className="w-16 text-center p-2 bg-gray-700 rounded-lg text-lg font-bold border border-gray-600 focus:border-orange-400 outline-none"
                          autoFocus
                        />
                        <span className="text-gray-500 font-bold">:</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={tempScore2}
                          onChange={e => setTempScore2(e.target.value)}
                          className="w-16 text-center p-2 bg-gray-700 rounded-lg text-lg font-bold border border-gray-600 focus:border-orange-400 outline-none"
                        />
                        <span className="flex-1 font-medium text-sm">{teams[match.team2]}</span>
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
                      <span className={`flex-1 text-right font-medium ${t1Wins ? 'text-green-400' : t2Wins ? 'text-red-400' : ''}`}>
                        {teams[match.team1]}
                      </span>
                      <div className="mx-4 min-w-[80px] text-center">
                        {isComplete ? (
                          <span className="text-2xl font-bold tracking-wider">
                            <span className={t1Wins ? 'text-green-400' : 'text-red-400'}>{match.score1}</span>
                            <span className="text-gray-600 mx-1">-</span>
                            <span className={t2Wins ? 'text-green-400' : 'text-red-400'}>{match.score2}</span>
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">vs</span>
                        )}
                      </div>
                      <span className={`flex-1 font-medium ${t2Wins ? 'text-green-400' : t1Wins ? 'text-red-400' : ''}`}>
                        {teams[match.team2]}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/80 text-gray-400">
                  <th className="text-left py-3 px-3">#</th>
                  <th className="text-left py-3">Team</th>
                  <th className="text-center py-3 px-2">P</th>
                  <th className="text-center py-3 px-2">W</th>
                  <th className="text-center py-3 px-2">L</th>
                  <th className="text-center py-3 px-2">PF</th>
                  <th className="text-center py-3 px-2">PA</th>
                  <th className="text-center py-3 px-3">+/-</th>
                </tr>
              </thead>
              <tbody>
                {getStandings().map((team, idx) => (
                  <tr key={team.idx} className={`border-t border-gray-700/50 ${idx === 0 && team.won > 0 ? 'bg-orange-500/10' : ''}`}>
                    <td className="py-3 px-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-orange-500/30 text-orange-300' : 'text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{team.name}</td>
                    <td className="text-center py-3 px-2 text-gray-400">{team.played}</td>
                    <td className="text-center py-3 px-2 text-green-400 font-semibold">{team.won}</td>
                    <td className="text-center py-3 px-2 text-red-400">{team.lost}</td>
                    <td className="text-center py-3 px-2 text-gray-300">{team.pointsFor}</td>
                    <td className="text-center py-3 px-2 text-gray-400">{team.pointsAgainst}</td>
                    <td className="text-center py-3 px-3">
                      <span className={team.pointsFor - team.pointsAgainst >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {team.pointsFor - team.pointsAgainst >= 0 ? '+' : ''}{team.pointsFor - team.pointsAgainst}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="space-y-3">
            {teams.map((team, idx) => (
              <div key={idx} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                {editingTeam === idx ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 p-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-orange-400 outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveTeamName()}
                    />
                    <button
                      onClick={saveTeamName}
                      className="bg-green-600 px-4 rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTeam(null)}
                      className="bg-gray-600 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditTeam(idx)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{team}</span>
                    </div>
                    <span className="text-gray-500 text-sm">tap to edit</span>
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
