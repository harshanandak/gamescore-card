import React from 'react';

const games = [
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    description: 'Tournament NRR Calculator',
    color: 'from-green-600 to-emerald-600',
    available: true
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    description: 'League Tracker',
    color: 'from-orange-600 to-red-600',
    available: true
  },
  {
    id: 'badminton',
    name: 'Badminton',
    icon: '🏸',
    description: 'Coming Soon',
    color: 'from-purple-600 to-pink-600',
    available: false
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    description: 'Coming Soon',
    color: 'from-blue-600 to-cyan-600',
    available: false
  }
];

export default function GameSelector({ onSelectGame }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <h1 className="text-4xl font-bold text-white mb-2">GameScore Card</h1>
        <p className="text-gray-400 text-lg">Your Universal Sports Scorecard</p>
      </div>

      {/* Game Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => game.available && onSelectGame(game.id)}
              disabled={!game.available}
              className={`
                relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300
                ${game.available
                  ? `bg-gradient-to-br ${game.color} hover:scale-105 hover:shadow-xl cursor-pointer`
                  : 'bg-gray-700 opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="text-5xl mb-3">{game.icon}</div>
              <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
              <p className="text-white/70 text-sm">{game.description}</p>
              {!game.available && (
                <div className="absolute top-2 right-2 bg-black/30 text-white/80 text-xs px-2 py-1 rounded-full">
                  Soon
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold text-white mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-white font-semibold mb-2">Tournament Mode</h3>
              <p className="text-gray-400 text-sm">League standings, NRR calculations, round-robin formats</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Quick Match</h3>
              <p className="text-gray-400 text-sm">Score single matches with instant results</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Statistics</h3>
              <p className="text-gray-400 text-sm">Detailed stats, points tables, and analytics</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>More sports coming soon: Badminton, Football, Tennis, and more!</p>
        </div>
      </div>
    </div>
  );
}
