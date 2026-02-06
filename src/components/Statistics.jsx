import React, { useState, useEffect } from 'react';
import { loadCricketTournaments, loadVolleyballTournaments } from '../utils/storage';

export default function Statistics({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [cricketData, setCricketData] = useState([]);
  const [volleyballData, setVolleyballData] = useState([]);

  useEffect(() => {
    setCricketData(loadCricketTournaments());
    setVolleyballData(loadVolleyballTournaments());
  }, []);

  const getOverviewStats = () => {
    const cricketMatches = cricketData.reduce((sum, t) => sum + (t.matches?.length || 0), 0);
    const volleyballMatches = volleyballData.reduce((sum, t) => sum + (t.matches?.filter(m => m.score1 !== null)?.length || 0), 0);

    return {
      totalTournaments: cricketData.length + volleyballData.length,
      totalMatches: cricketMatches + volleyballMatches,
      cricketTournaments: cricketData.length,
      cricketMatches,
      volleyballTournaments: volleyballData.length,
      volleyballMatches
    };
  };

  const getCricketStats = () => {
    const teamStats = {};

    cricketData.forEach(tournament => {
      tournament.matches?.forEach(match => {
        // Team 1 stats
        if (!teamStats[match.team1]) {
          teamStats[match.team1] = { played: 0, won: 0, lost: 0, tied: 0, runsScored: 0, runsConceded: 0 };
        }
        teamStats[match.team1].played++;
        teamStats[match.team1].runsScored += match.team1Score;
        teamStats[match.team1].runsConceded += match.team2Score;

        // Team 2 stats
        if (!teamStats[match.team2]) {
          teamStats[match.team2] = { played: 0, won: 0, lost: 0, tied: 0, runsScored: 0, runsConceded: 0 };
        }
        teamStats[match.team2].played++;
        teamStats[match.team2].runsScored += match.team2Score;
        teamStats[match.team2].runsConceded += match.team1Score;

        // Win/Loss/Tie
        if (match.winner === match.team1) {
          teamStats[match.team1].won++;
          teamStats[match.team2].lost++;
        } else if (match.winner === match.team2) {
          teamStats[match.team2].won++;
          teamStats[match.team1].lost++;
        } else {
          teamStats[match.team1].tied++;
          teamStats[match.team2].tied++;
        }
      });
    });

    return Object.entries(teamStats)
      .map(([team, stats]) => ({ team, ...stats }))
      .sort((a, b) => b.won - a.won);
  };

  const getVolleyballStats = () => {
    const teamStats = {};

    volleyballData.forEach(tournament => {
      const teams = tournament.teams || [];
      tournament.matches?.forEach(match => {
        if (match.score1 === null) return;

        const team1Name = teams[match.team1]?.name || `Team ${match.team1 + 1}`;
        const team2Name = teams[match.team2]?.name || `Team ${match.team2 + 1}`;

        // Team 1 stats
        if (!teamStats[team1Name]) {
          teamStats[team1Name] = { played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0 };
        }
        teamStats[team1Name].played++;
        teamStats[team1Name].pointsFor += match.score1;
        teamStats[team1Name].pointsAgainst += match.score2;

        // Team 2 stats
        if (!teamStats[team2Name]) {
          teamStats[team2Name] = { played: 0, won: 0, lost: 0, pointsFor: 0, pointsAgainst: 0 };
        }
        teamStats[team2Name].played++;
        teamStats[team2Name].pointsFor += match.score2;
        teamStats[team2Name].pointsAgainst += match.score1;

        // Win/Loss
        if (match.score1 > match.score2) {
          teamStats[team1Name].won++;
          teamStats[team2Name].lost++;
        } else {
          teamStats[team2Name].won++;
          teamStats[team1Name].lost++;
        }
      });
    });

    return Object.entries(teamStats)
      .map(([team, stats]) => ({ team, ...stats }))
      .sort((a, b) => b.won - a.won);
  };

  const overview = getOverviewStats();
  const cricketStats = getCricketStats();
  const volleyballStats = getVolleyballStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 md:p-5">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="text-white/80 hover:text-white mb-2 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Statistics</h1>
          <p className="text-white/70 text-sm">All-time stats across sports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto">
        <div className="flex bg-gray-900 border-b border-gray-800 overflow-x-auto">
          {['overview', 'cricket', 'volleyball'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' : tab === 'cricket' ? '🏏 Cricket' : '🏐 Volleyball'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="text-3xl md:text-4xl font-bold text-purple-400">{overview.totalTournaments}</div>
                <div className="text-gray-400 text-sm">Total Tournaments</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="text-3xl md:text-4xl font-bold text-green-400">{overview.totalMatches}</div>
                <div className="text-gray-400 text-sm">Total Matches</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 col-span-2 md:col-span-1">
                <div className="text-3xl md:text-4xl font-bold text-orange-400">
                  {cricketStats.length + volleyballStats.length}
                </div>
                <div className="text-gray-400 text-sm">Teams Played</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏏</span>
                  <span className="font-semibold">Cricket</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-green-400">{overview.cricketTournaments}</div>
                    <div className="text-gray-400">Tournaments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{overview.cricketMatches}</div>
                    <div className="text-gray-400">Matches</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏐</span>
                  <span className="font-semibold">Volleyball</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{overview.volleyballTournaments}</div>
                    <div className="text-gray-400">Tournaments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">{overview.volleyballMatches}</div>
                    <div className="text-gray-400">Matches</div>
                  </div>
                </div>
              </div>
            </div>

            {overview.totalMatches === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📊</div>
                <p>No matches played yet</p>
                <p className="text-sm">Start a tournament to see statistics</p>
              </div>
            )}
          </div>
        )}

        {/* Cricket Tab */}
        {activeTab === 'cricket' && (
          <div>
            {cricketStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">🏏</div>
                <p>No cricket matches played yet</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700/50 text-gray-400">
                        <th className="text-left py-3 px-3">Team</th>
                        <th className="text-center py-3 px-2">P</th>
                        <th className="text-center py-3 px-2">W</th>
                        <th className="text-center py-3 px-2">L</th>
                        <th className="text-center py-3 px-2">T</th>
                        <th className="text-center py-3 px-2">Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cricketStats.map((team, idx) => (
                        <tr key={team.team} className="border-t border-gray-700/50">
                          <td className="py-3 px-3 font-medium">{team.team}</td>
                          <td className="text-center py-3 px-2 text-gray-400">{team.played}</td>
                          <td className="text-center py-3 px-2 text-green-400">{team.won}</td>
                          <td className="text-center py-3 px-2 text-red-400">{team.lost}</td>
                          <td className="text-center py-3 px-2 text-yellow-400">{team.tied}</td>
                          <td className="text-center py-3 px-2">{team.runsScored}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Volleyball Tab */}
        {activeTab === 'volleyball' && (
          <div>
            {volleyballStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">🏐</div>
                <p>No volleyball matches played yet</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-700/50 text-gray-400">
                        <th className="text-left py-3 px-3">Team</th>
                        <th className="text-center py-3 px-2">P</th>
                        <th className="text-center py-3 px-2">W</th>
                        <th className="text-center py-3 px-2">L</th>
                        <th className="text-center py-3 px-2">PF</th>
                        <th className="text-center py-3 px-2">PA</th>
                        <th className="text-center py-3 px-2">+/-</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volleyballStats.map((team, idx) => (
                        <tr key={team.team} className="border-t border-gray-700/50">
                          <td className="py-3 px-3 font-medium">{team.team}</td>
                          <td className="text-center py-3 px-2 text-gray-400">{team.played}</td>
                          <td className="text-center py-3 px-2 text-green-400">{team.won}</td>
                          <td className="text-center py-3 px-2 text-red-400">{team.lost}</td>
                          <td className="text-center py-3 px-2">{team.pointsFor}</td>
                          <td className="text-center py-3 px-2 text-gray-400">{team.pointsAgainst}</td>
                          <td className="text-center py-3 px-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
