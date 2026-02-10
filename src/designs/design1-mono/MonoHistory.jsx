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
        <nav className="flex items-center justify-between mb-10" aria-label="History navigation">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-transparent border-none cursor-pointer font-swiss text-sm"
              style={{ color: '#888' }}
              aria-label="Go back to home"
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
        </nav>

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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption className="sr-only">Game history</caption>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th
                  scope="col"
                  className="text-xs uppercase tracking-widest font-normal text-left py-3"
                  style={{ color: '#888', width: '72px' }}
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="text-xs uppercase tracking-widest font-normal text-left py-3"
                  style={{ color: '#888' }}
                >
                  Game
                </th>
                <th
                  scope="col"
                  className="text-xs uppercase tracking-widest font-normal text-left py-3"
                  style={{ color: '#888' }}
                >
                  Players
                </th>
                <th
                  scope="col"
                  className="text-xs uppercase tracking-widest font-normal text-left py-3"
                  style={{ color: '#888', width: '80px' }}
                >
                  Score
                </th>
                <th
                  scope="col"
                  className="text-xs uppercase tracking-widest font-normal text-left py-3"
                  style={{ color: '#888', width: '80px' }}
                >
                  Winner
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => {
                const scores = record.participants
                  .map((name) => record.finalScores[name] ?? 0)
                  .join(' : ');

                return (
                  <tr
                    key={record.id}
                    style={{ borderBottom: '1px solid #eee' }}
                  >
                    <td
                      className="text-sm font-mono py-3"
                      style={{ color: '#111' }}
                    >
                      {formatDate(record.completedAt)}
                    </td>
                    <td className="text-sm py-3" style={{ color: '#111' }}>
                      {record.gameName}
                    </td>
                    <td className="text-sm py-3" style={{ color: '#888' }}>
                      {record.participants.join(', ')}
                    </td>
                    <td
                      className="text-sm font-mono mono-score py-3"
                      style={{ color: '#111' }}
                    >
                      <span aria-live="polite">{scores}</span>
                    </td>
                    <td
                      className="text-sm py-3"
                      style={{ color: record.winner ? '#0066ff' : '#888' }}
                    >
                      {record.winner || '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
