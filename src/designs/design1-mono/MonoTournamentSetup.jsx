import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveCricketTournament, saveVolleyballTournament } from '../../utils/storage';
import { generateRoundRobinMatches } from '../../utils/roundRobin';
import { OVERS_PRESETS } from '../../utils/cricketCalculations';
import { POINTS_PRESETS } from '../../utils/volleyballCalculations';

export default function MonoTournamentSetup() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const isCricket = sport === 'cricket';

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teamCount, setTeamCount] = useState(4);
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(isCricket ? { overs: 5 } : { target: 10 });
  const [customOvers, setCustomOvers] = useState('');
  const [visible, setVisible] = useState(true);

  const teamCountOptions = [3, 4, 5, 6, 7, 8];

  const initTeams = (count) => {
    setTeams(Array.from({ length: count }, (_, i) => ({
      id: `team-${Date.now()}-${i}`,
      name: `Team ${i + 1}`,
      members: [],
    })));
  };

  const goToStep2 = () => {
    if (!name.trim()) return;
    initTeams(teamCount);
    setStep(2);
  };

  const updateTeamName = (index, newName) => {
    setTeams(prev => prev.map((t, i) => i === index ? { ...t, name: newName } : t));
  };

  const startTournament = () => {
    const hasEmptyNames = teams.some(t => !t.name.trim());
    if (hasEmptyNames) return;

    const matches = generateRoundRobinMatches(teams);
    const tournament = {
      id: Date.now(),
      name: name.trim(),
      teams,
      matches: isCricket
        ? matches.map(m => ({ ...m, team1Score: null, team2Score: null, format }))
        : matches.map(m => ({ ...m, score1: null, score2: null })),
      format,
      createdAt: new Date().toISOString(),
      mode: 'tournament',
    };

    if (isCricket) {
      saveCricketTournament(tournament);
      navigate(`/cricket/tournament/${tournament.id}`);
    } else {
      saveVolleyballTournament(tournament);
      navigate(`/volleyball/tournament/${tournament.id}`);
    }
  };

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            Home
          </button>
          <span style={{ color: '#ccc' }}>/</span>
          <span className="text-sm" style={{ color: '#111' }}>
            {isCricket ? 'Cricket' : 'Volleyball'} Tournament
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight mb-8" style={{ color: '#111' }}>
          New Tournament
        </h1>

        {/* Step 1: Name + Format + Team Count */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Tournament Name */}
            <div className="mb-8">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                Tournament name
              </label>
              <input
                type="text"
                className="mono-input text-lg"
                placeholder={isCricket ? 'Weekend Cricket League' : 'Volleyball Championship'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Format */}
            <div className="mb-8">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                {isCricket ? 'Overs per innings' : 'Points to win'}
              </label>

              <div className="flex gap-2 flex-wrap mb-3">
                {(isCricket ? OVERS_PRESETS : POINTS_PRESETS).map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      if (isCricket) {
                        setFormat({ overs: preset.value });
                        setCustomOvers('');
                      } else {
                        setFormat({ target: preset.value });
                      }
                    }}
                    className={
                      (isCricket ? format.overs === preset.value : format.target === preset.value)
                        ? 'mono-btn-primary'
                        : 'mono-btn'
                    }
                    style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {isCricket && (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#888' }}>Custom:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="mono-input"
                    style={{ width: '80px', textAlign: 'center' }}
                    placeholder="1-50"
                    value={customOvers}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setCustomOvers(e.target.value);
                      if (v >= 1 && v <= 50) setFormat({ overs: v });
                    }}
                  />
                  <span className="text-xs" style={{ color: '#888' }}>overs</span>
                </div>
              )}
            </div>

            {/* Team Count */}
            <div className="mb-10">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                Number of teams
              </label>
              <div className="flex gap-2">
                {teamCountOptions.map(n => (
                  <button
                    key={n}
                    onClick={() => setTeamCount(n)}
                    className={teamCount === n ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ width: '44px', height: '44px', padding: 0, fontSize: '0.9375rem' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#888' }}>
                {(teamCount * (teamCount - 1)) / 2} matches (round-robin)
              </p>
            </div>

            <hr className="mono-divider mb-8" />

            <button
              onClick={goToStep2}
              className="mono-btn-primary w-full"
              style={{ padding: '12px', fontSize: '0.9375rem', opacity: name.trim() ? 1 : 0.4 }}
              disabled={!name.trim()}
            >
              Next: Name Teams
            </button>
          </div>
        )}

        {/* Step 2: Team Names */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs uppercase tracking-widest font-normal" style={{ color: '#888' }}>
                  Team names
                </label>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                  style={{ color: '#0066ff' }}
                >
                  Back
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {teams.map((team, i) => (
                  <div key={team.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-5 text-right" style={{ color: '#bbb' }}>
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      className="mono-input flex-1"
                      value={team.name}
                      onChange={(e) => updateTeamName(i, e.target.value)}
                      placeholder={`Team ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mono-card mb-8" style={{ padding: '16px 20px' }}>
              <h3 className="text-xs uppercase tracking-widest font-normal mb-3" style={{ color: '#888' }}>
                Summary
              </h3>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Tournament</span>
                  <span style={{ color: '#111' }}>{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Format</span>
                  <span className="font-mono" style={{ color: '#111' }}>
                    {isCricket ? `${format.overs} overs` : `First to ${format.target}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Teams</span>
                  <span className="font-mono" style={{ color: '#111' }}>{teamCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Matches</span>
                  <span className="font-mono" style={{ color: '#111' }}>
                    {(teamCount * (teamCount - 1)) / 2}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={startTournament}
              className="mono-btn-primary w-full"
              style={{ padding: '12px', fontSize: '0.9375rem' }}
            >
              Start Tournament
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
