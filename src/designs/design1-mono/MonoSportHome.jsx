import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSportTournaments } from '../../utils/storage';
import { getSportsByCategory } from '../../models/sportRegistry';

const LAYOUT_KEY = 'gamescore_sport_layout';

export default function MonoSportHome() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [tournamentCounts, setTournamentCounts] = useState({});
  const [activeTab, setActiveTab] = useState('Racquet Sports');
  const [selectedSport, setSelectedSport] = useState(null);
  const [layout, setLayout] = useState(() => {
    return localStorage.getItem(LAYOUT_KEY) || 'tabs'; // 'tabs' or 'grid'
  });

  const SPORT_CATEGORIES = getSportsByCategory();
  const categoryKeys = Object.keys(SPORT_CATEGORIES);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    // Load tournament counts for all sports
    const counts = {};
    Object.values(SPORT_CATEGORIES).flat().forEach(sport => {
      const tournaments = loadSportTournaments(sport.storageKey);
      counts[sport.id] = tournaments.length;
    });
    setTournamentCounts(counts);
  }, []);

  const getCounts = (id) => {
    return tournamentCounts[id] || 0;
  };

  const switchLayout = () => {
    const newLayout = layout === 'tabs' ? 'grid' : 'tabs';
    setLayout(newLayout);
    localStorage.setItem(LAYOUT_KEY, newLayout);
  };

  const openSportModal = (sport) => {
    setSelectedSport(sport);
  };

  const closeSportModal = () => {
    setSelectedSport(null);
  };

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <nav className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-sm bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#888' }}
            >
              &larr;
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#111' }}>
                GameScore
              </h1>
              <p className="text-xs mt-1" style={{ color: '#888' }}>
                All sports
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={switchLayout}
              className="text-xs bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#0066ff' }}
              title={layout === 'tabs' ? 'Switch to grid view' : 'Switch to tabs view'}
            >
              {layout === 'tabs' ? '⊞' : '☰'}
            </button>
            <button
              onClick={() => navigate('/statistics')}
              className="text-sm bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#888' }}
            >
              Statistics
            </button>
          </div>
        </nav>

        {/* Sport Selection */}
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-widest font-normal mb-6" style={{ color: '#888' }}>
            Choose sport
          </h2>

          {/* TABBED LAYOUT */}
          {layout === 'tabs' && (
            <>
              {/* Tab Headers */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {categoryKeys.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`text-xs px-4 py-2 whitespace-nowrap transition-all ${
                      activeTab === category ? 'font-medium' : 'font-normal'
                    }`}
                    style={{
                      color: activeTab === category ? '#0066ff' : '#888',
                      borderBottom: activeTab === category ? '2px solid #0066ff' : '2px solid transparent',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SPORT_CATEGORIES[activeTab].map(sport => (
                    <div key={sport.id} className="mono-card" style={{ padding: 0 }}>
                      <div style={{ padding: '20px 24px' }}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{sport.icon}</span>
                          <div className="flex-1">
                            <h3 className="text-base font-semibold mb-1" style={{ color: '#111' }}>
                              {sport.name}
                            </h3>
                            <p className="text-xs" style={{ color: '#888' }}>{sport.desc}</p>
                          </div>
                        </div>

                        {getCounts(sport.id) > 0 && (
                          <div className="text-xs mb-3" style={{ color: '#888' }}>
                            <span className="font-mono">{getCounts(sport.id)} saved</span> tournament{getCounts(sport.id) > 1 ? 's' : ''}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/${sport.id}/tournament`)}
                            className="mono-btn-primary flex-1"
                            style={{ fontSize: '0.8125rem', padding: '10px 16px' }}
                          >
                            <div className="flex flex-col items-center">
                              <span>Tournament</span>
                              <span className="text-xs font-normal opacity-80 mt-0.5">
                                2-8 teams
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => navigate(`/${sport.id}/quick`)}
                            className="mono-btn flex-1"
                            style={{ fontSize: '0.8125rem', padding: '10px 16px' }}
                          >
                            <div className="flex flex-col items-center">
                              <span>Quick Match</span>
                              <span className="text-xs font-normal opacity-60 mt-0.5">
                                Instant
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* GRID LAYOUT */}
          {layout === 'grid' && (
            <>
              {Object.entries(SPORT_CATEGORIES).map(([category, sports]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-xs font-medium mb-4" style={{ color: '#666' }}>
                    {category}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sports.map(sport => (
                      <div
                        key={sport.id}
                        className="mono-card cursor-pointer hover:border-blue-200 transition-colors"
                        style={{ padding: '16px', position: 'relative' }}
                        onClick={() => openSportModal(sport)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <span className="text-3xl mb-2">{sport.icon}</span>
                          <h4 className="text-sm font-semibold mb-1" style={{ color: '#111' }}>
                            {sport.name}
                          </h4>
                          {getCounts(sport.id) > 0 && (
                            <span className="text-xs font-mono" style={{ color: '#888' }}>
                              {getCounts(sport.id)} saved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <hr className="mono-divider" />

        {/* More games link */}
        <div className="mt-8 flex flex-col items-center" style={{ minHeight: '10vh' }}>
          <button
            onClick={() => navigate('/setup')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#0066ff' }}
          >
            Other games (generic scorer)
          </button>
          <p className="text-xs mt-2" style={{ color: '#bbb' }}>
            Universal scorekeeper for any game
          </p>
        </div>
      </div>

      {/* Sport Selection Modal (for Grid layout) */}
      {selectedSport && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={closeSportModal}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{selectedSport.icon}</span>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#111' }}>
                  {selectedSport.name}
                </h2>
                <p className="text-sm" style={{ color: '#888' }}>
                  {selectedSport.desc}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => {
                  closeSportModal();
                  navigate(`/${selectedSport.id}/tournament`);
                }}
                className="mono-btn-primary w-full"
                style={{ padding: '14px', fontSize: '0.9375rem' }}
              >
                <div className="flex flex-col items-center">
                  <span>Tournament</span>
                  <span className="text-xs font-normal opacity-80 mt-1">
                    2-8 teams, standings, multiple matches
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  closeSportModal();
                  navigate(`/${selectedSport.id}/quick`);
                }}
                className="mono-btn w-full"
                style={{ padding: '14px', fontSize: '0.9375rem' }}
              >
                <div className="flex flex-col items-center">
                  <span>Quick Match</span>
                  <span className="text-xs font-normal opacity-60 mt-1">
                    Single game, instant scoring
                  </span>
                </div>
              </button>
            </div>

            {getCounts(selectedSport.id) > 0 && (
              <div
                className="text-center text-xs pt-4"
                style={{ color: '#888', borderTop: '1px solid #eee' }}
              >
                {getCounts(selectedSport.id)} saved tournament{getCounts(selectedSport.id) > 1 ? 's' : ''}
              </div>
            )}

            <button
              onClick={closeSportModal}
              className="text-xs mt-4 w-full bg-transparent border-none cursor-pointer"
              style={{ color: '#888' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
