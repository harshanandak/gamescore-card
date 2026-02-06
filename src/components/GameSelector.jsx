import React, { useState } from 'react';
import { loadCricketTournaments, loadVolleyballTournaments, loadAllStatistics } from '../utils/storage';

const games = [
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    color: 'from-green-600 to-emerald-600',
    available: true
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    color: 'from-orange-600 to-red-600',
    available: true
  },
  {
    id: 'badminton',
    name: 'Badminton',
    icon: '🏸',
    color: 'from-purple-600 to-pink-600',
    available: false
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    color: 'from-blue-600 to-cyan-600',
    available: false
  }
];

export default function GameSelector({ onSelectGame, onShowStatistics }) {
  const [selectedSport, setSelectedSport] = useState(null);

  const handleSportClick = (game) => {
    if (!game.available) return;
    setSelectedSport(game.id);
  };

  const handleModeSelect = (mode) => {
    onSelectGame(selectedSport, mode);
  };

  const handleBack = () => {
    setSelectedSport(null);
  };

  // Mode selection screen
  if (selectedSport) {
    const game = games.find(g => g.id === selectedSport);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2"
          >
            <span>←</span> Back to Sports
          </button>

          {/* Sport header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{game.icon}</div>
            <h2 className="text-3xl font-bold text-white">{game.name}</h2>
            <p className="text-gray-400 mt-2">Select game mode</p>
          </div>

          {/* Mode buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleModeSelect('tournament')}
              className={`w-full p-6 rounded-2xl bg-gradient-to-br ${game.color} text-left transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">🏆</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tournament Mode</h3>
                  <p className="text-white/70 text-sm mt-1">
                    League standings, points table, NRR calculations
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('quickmatch')}
              className="w-full p-6 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-600 text-left transition-all hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">⚡</div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Match</h3>
                  <p className="text-white/70 text-sm mt-1">
                    Score a single match with instant results
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main sport selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="text-center pt-8 md:pt-12 pb-6 md:pb-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">GameScore Card</h1>
        <p className="text-gray-400 text-base md:text-lg">Your Universal Sports Scorecard</p>
      </div>

      {/* Game Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => handleSportClick(game)}
              disabled={!game.available}
              className={`
                relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 text-left transition-all duration-300
                ${game.available
                  ? `bg-gradient-to-br ${game.color} hover:scale-105 hover:shadow-xl cursor-pointer`
                  : 'bg-gray-700 opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">{game.icon}</div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-0.5 md:mb-1">{game.name}</h3>
              {!game.available && (
                <span className="text-white/60 text-xs md:text-sm">Coming Soon</span>
              )}
              {game.available && (
                <span className="text-white/70 text-xs md:text-sm">Tap to play</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Button */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        <button
          onClick={onShowStatistics}
          className="w-full p-4 md:p-5 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-left transition-all hover:scale-[1.02] hover:shadow-xl"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-3xl md:text-4xl">📊</div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Statistics</h3>
              <p className="text-white/70 text-xs md:text-sm">View stats across all sports</p>
            </div>
          </div>
        </button>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 md:mb-6 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 md:p-5 border border-gray-700">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">🏆</div>
            <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">Tournament Mode</h3>
            <p className="text-gray-400 text-xs md:text-sm">League standings, NRR, round-robin</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 md:p-5 border border-gray-700">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">Quick Match</h3>
            <p className="text-gray-400 text-xs md:text-sm">Score single matches instantly</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 md:p-5 border border-gray-700">
            <div className="text-2xl md:text-3xl mb-2 md:mb-3">💾</div>
            <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">Auto Save</h3>
            <p className="text-gray-400 text-xs md:text-sm">Data saved permanently</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs md:text-sm pb-8 px-4">
        <p>More sports coming soon!</p>
      </div>
    </div>
  );
}
