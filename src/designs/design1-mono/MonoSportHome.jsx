import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSportTournaments } from '../../utils/storage';
import { getSportsList } from '../../models/sportRegistry';

export default function MonoSportHome() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [tournamentCounts, setTournamentCounts] = useState({});

  const SPORTS = getSportsList();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    // Load tournament counts for all sports
    const counts = {};
    SPORTS.forEach(sport => {
      const tournaments = loadSportTournaments(sport.storageKey);
      counts[sport.id] = tournaments.length;
    });
    setTournamentCounts(counts);
  }, []);

  const getCounts = (id) => {
    return tournamentCounts[id] || 0;
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
          <button
            onClick={() => navigate('/statistics')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            Statistics
          </button>
        </nav>

        {/* Sport Selection */}
        <div className="mb-10">
          <h2 className="text-xs uppercase tracking-widest font-normal mb-6" style={{ color: '#888' }}>
            Choose sport
          </h2>

          <div className="flex flex-col gap-3">
            {SPORTS.map(sport => (
              <div key={sport.id} className="mono-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sport.icon}</span>
                      <div>
                        <h3 className="text-base font-semibold" style={{ color: '#111' }}>
                          {sport.name}
                        </h3>
                        <p className="text-xs" style={{ color: '#888' }}>{sport.desc}</p>
                      </div>
                    </div>
                    {getCounts(sport.id) > 0 && (
                      <span className="text-xs font-mono" style={{ color: '#888' }}>
                        {getCounts(sport.id)} saved
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/${sport.id}/tournament`)}
                      className="mono-btn-primary flex-1"
                      style={{ fontSize: '0.8125rem', padding: '10px 16px' }}
                    >
                      Tournament
                    </button>
                    <button
                      onClick={() => navigate(`/${sport.id}/quick`)}
                      className="mono-btn flex-1"
                      style={{ fontSize: '0.8125rem', padding: '10px 16px' }}
                    >
                      Quick Match
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            Badminton, Football, Basketball, and more
          </p>
        </div>
      </div>
    </div>
  );
}
