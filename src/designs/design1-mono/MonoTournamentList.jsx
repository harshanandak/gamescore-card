import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  loadCricketTournaments, deleteCricketTournament,
  loadVolleyballTournaments, deleteVolleyballTournament,
} from '../../utils/storage';

export default function MonoTournamentList() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const isCricket = sport === 'cricket';
  const [tournaments, setTournaments] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loaded = isCricket ? loadCricketTournaments() : loadVolleyballTournaments();
    setTournaments(loaded.filter(t => t.mode === 'tournament' || !t.mode));
    requestAnimationFrame(() => setVisible(true));
  }, [sport]);

  const deleteTournament = (id) => {
    if (!confirm('Delete this tournament?')) return;
    if (isCricket) deleteCricketTournament(id);
    else deleteVolleyballTournament(id);
    setTournaments(prev => prev.filter(t => t.id !== id));
  };

  const sportLabel = isCricket ? 'Cricket' : 'Volleyball';
  const sportIcon = isCricket ? '\u{1F3CF}' : '\u{1F3D0}';

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate('/')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            \u2190 Home
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#111' }}>
            {sportIcon} {sportLabel} Tournaments
          </h1>
        </div>

        {/* Create button */}
        <button
          onClick={() => navigate(`/${sport}/tournament/new`)}
          className="mono-btn-primary w-full mb-8"
          style={{ padding: '12px', fontSize: '0.9375rem' }}
        >
          + New Tournament
        </button>

        {/* List */}
        {tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '30vh' }}>
            <span className="text-4xl mb-4">{sportIcon}</span>
            <p className="text-sm" style={{ color: '#888' }}>No tournaments yet</p>
            <p className="text-xs mt-1" style={{ color: '#bbb' }}>Create one to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tournaments.map(t => {
              const matchCount = t.matches?.length || 0;
              const completedCount = t.matches?.filter(m =>
                m.status === 'completed' || m.score1 !== null
              ).length || 0;

              return (
                <div key={t.id} className="mono-card" style={{ padding: 0 }}>
                  <div
                    className="cursor-pointer"
                    style={{ padding: '16px 20px' }}
                    onClick={() => navigate(`/${sport}/tournament/${t.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium" style={{ color: '#111' }}>{t.name}</h3>
                      <span className="mono-badge mono-badge-live">
                        {completedCount}/{matchCount}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#888' }}>
                      {t.teams?.length || 0} teams &middot; {matchCount} matches
                      {t.format?.overs ? ` \u00b7 ${t.format.overs} overs` : ''}
                      {t.format?.target ? ` \u00b7 First to ${t.format.target}` : ''}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid #eee', padding: '8px 20px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTournament(t.id); }}
                      className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                      style={{ color: '#dc2626' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
