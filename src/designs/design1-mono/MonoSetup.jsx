import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSession } from '../../hooks/useGameSession';
import { useGameTemplates } from '../../hooks/useGameTemplates';
import { createParticipant } from '../../models/types';

export default function MonoSetup() {
  const navigate = useNavigate();
  const { startGame } = useGameSession();
  const { templates } = useGameTemplates();

  const [visible, setVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState('');

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleAddPlayer = () => {
    const name = playerInput.trim();
    if (name && !players.includes(name)) {
      setPlayers((prev) => [...prev, name]);
      setPlayerInput('');
    }
  };

  const handleRemovePlayer = (index) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlayerKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  };

  const handleStart = () => {
    if (!selectedTemplate || !gameName.trim() || players.length < 2) return;
    const participants = players.map((name) => createParticipant({ name }));
    const newSession = startGame({
      template: selectedTemplate,
      name: gameName,
      participants,
    });
    navigate(`/game/${newSession.id}`);
  };

  const canStart = selectedTemplate && gameName.trim() && players.length >= 2;

  return (
    <div
      className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-10 text-sm">
          <button
            onClick={() => navigate('/')}
            className="bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            Home
          </button>
          <span style={{ color: '#ddd' }}>/</span>
          <span style={{ color: '#111' }}>New Game</span>
        </nav>

        {/* Game Type */}
        <section className="mb-10">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-4"
            style={{ color: '#888' }}
          >
            Game Type
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`mono-type-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              >
                <span className="mono-type-icon">{template.icon}</span>
                <span className="mono-type-name">{template.name}</span>
              </button>
            ))}
          </div>
        </section>

        <hr className="mono-divider" style={{ marginBottom: '32px' }} />

        {/* Game Name */}
        <section className="mb-10">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-4"
            style={{ color: '#888' }}
          >
            Game Name
          </h2>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g. Friday Night Match"
            className="mono-input"
            style={{ maxWidth: '400px' }}
          />
        </section>

        <hr className="mono-divider" style={{ marginBottom: '32px' }} />

        {/* Players */}
        <section className="mb-10">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-4"
            style={{ color: '#888' }}
          >
            Players
          </h2>

          {/* Player list */}
          {players.length > 0 && (
            <div className="mb-6">
              {players.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid #eee' }}
                >
                  <span className="text-sm font-swiss" style={{ color: '#111' }}>
                    {name}
                  </span>
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="bg-transparent border-none cursor-pointer font-swiss text-sm"
                    style={{ color: '#888' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add player input */}
          <div className="flex items-end gap-3" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyDown={handlePlayerKeyDown}
              placeholder="Player or team name"
              className="mono-input"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleAddPlayer}
              className="mono-btn"
              style={{ marginBottom: '1px', whiteSpace: 'nowrap' }}
            >
              Add
            </button>
          </div>

          {players.length < 2 && players.length > 0 && (
            <p className="text-xs mt-3" style={{ color: '#888' }}>
              Add at least {2 - players.length} more
            </p>
          )}
        </section>

        <hr className="mono-divider" style={{ marginBottom: '32px' }} />

        {/* Start button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="mono-btn-primary"
            style={{
              opacity: canStart ? 1 : 0.4,
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            Start Game
          </button>
          {!canStart && (
            <span className="text-xs" style={{ color: '#888' }}>
              {!selectedTemplate
                ? 'Select a game type'
                : !gameName.trim()
                ? 'Enter a game name'
                : 'Add at least 2 players'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
