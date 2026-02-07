import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameHistory } from '../../hooks/useGameHistory';

export default function MonoHistory() {
  const navigate = useNavigate();
  const { history, clearAll } = useGameHistory();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}.${month}.${year}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-transparent border-none cursor-pointer font-swiss text-sm"
              style={{ color: '#888' }}
            >
              &larr;
            </button>
            <h1 className="text-xl font-semibold" style={{ color: '#111' }}>
              History
            </h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearAll}
              className="bg-transparent border-none cursor-pointer font-swiss text-sm"
              style={{ color: '#dc2626' }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 ? (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: '50vh' }}
          >
            <p className="text-sm" style={{ color: '#888' }}>
              No games played yet
            </p>
          </div>
        ) : (
          /* Table */
          <div>
            {/* Table header */}
            <div
              className="grid items-center py-3"
              style={{
                gridTemplateColumns: '72px 1fr 1fr 80px 80px',
                gap: '12px',
                borderBottom: '1px solid #eee',
              }}
            >
              <span
                className="text-xs uppercase tracking-widest font-normal"
                style={{ color: '#888' }}
              >
                Date
              </span>
              <span
                className="text-xs uppercase tracking-widest font-normal"
                style={{ color: '#888' }}
              >
                Game
              </span>
              <span
                className="text-xs uppercase tracking-widest font-normal"
                style={{ color: '#888' }}
              >
                Players
              </span>
              <span
                className="text-xs uppercase tracking-widest font-normal"
                style={{ color: '#888' }}
              >
                Score
              </span>
              <span
                className="text-xs uppercase tracking-widest font-normal"
                style={{ color: '#888' }}
              >
                Winner
              </span>
            </div>

            {/* Table rows */}
            {history.map((record) => {
              const scores = record.participants
                .map((name) => record.finalScores[name] ?? 0)
                .join(' : ');

              return (
                <div
                  key={record.id}
                  className="grid items-center py-3"
                  style={{
                    gridTemplateColumns: '72px 1fr 1fr 80px 80px',
                    gap: '12px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <span
                    className="text-sm font-mono"
                    style={{ color: '#111' }}
                  >
                    {formatDate(record.completedAt)}
                  </span>
                  <span className="text-sm" style={{ color: '#111' }}>
                    {record.gameName}
                  </span>
                  <span className="text-sm" style={{ color: '#888' }}>
                    {record.participants.join(', ')}
                  </span>
                  <span
                    className="text-sm font-mono mono-score"
                    style={{ color: '#111' }}
                  >
                    {scores}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: record.winner ? '#0066ff' : '#888' }}
                  >
                    {record.winner || '--'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
