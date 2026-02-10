import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveSportTournament } from '../../utils/storage';
import { generateRoundRobinMatches } from '../../utils/roundRobin';
import { getSportById } from '../../models/sportRegistry';
import { OVERS_PRESETS } from '../../utils/cricketCalculations';

export default function MonoTournamentSetup() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const sportConfig = getSportById(sport);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teamCount, setTeamCount] = useState(4);
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [customOvers, setCustomOvers] = useState('');
  const [visible, setVisible] = useState(true);

  const isCricket = sportConfig?.engine === 'custom-cricket';

  // Initialize format based on sport
  React.useEffect(() => {
    if (!sportConfig || format !== null) return;
    if (sportConfig.engine === 'custom-cricket') {
      setFormat({ overs: 5 });
    } else if (sportConfig.engine === 'sets') {
      const defaultFormatIndex = sportConfig.config.defaultSetFormat || 0;
      const defaultFormat = sportConfig.config.setFormats[defaultFormatIndex];
      setFormat({ sets: defaultFormat.sets, points: sportConfig.config.pointsPerSet });
    } else if (sportConfig.engine === 'goals') {
      setFormat({});
    }
  }, [sportConfig, format]);

  const teamCountOptions = [2, 3, 4, 5, 6, 7, 8];

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

  const addMember = (teamIdx) => {
    setTeams(prev => prev.map((t, i) =>
      i === teamIdx ? { ...t, members: [...t.members, ''] } : t
    ));
  };

  const updateMember = (teamIdx, memberIdx, value) => {
    setTeams(prev => prev.map((t, i) =>
      i === teamIdx
        ? { ...t, members: t.members.map((m, mi) => mi === memberIdx ? value : m) }
        : t
    ));
  };

  const removeMember = (teamIdx, memberIdx) => {
    setTeams(prev => prev.map((t, i) =>
      i === teamIdx
        ? { ...t, members: t.members.filter((_, mi) => mi !== memberIdx) }
        : t
    ));
  };

  const startTournament = () => {
    if (!sportConfig) return;
    const hasEmptyNames = teams.some(t => !t.name.trim());
    if (hasEmptyNames) return;

    // Generate matches based on team count
    let matches;
    if (teamCount === 2) {
      // Single match for 2-team tournament
      matches = [{
        id: `${Date.now()}-0`,
        team1Id: teams[0].id,
        team2Id: teams[1].id,
        status: 'pending',
      }];
    } else {
      // Round-robin for 3+ teams
      matches = generateRoundRobinMatches(teams);
    }

    // Initialize matches based on engine type
    let initializedMatches;
    if (sportConfig.engine === 'sets') {
      initializedMatches = matches.map(m => ({ ...m, sets: [], status: 'pending' }));
    } else if (sportConfig.engine === 'goals') {
      initializedMatches = matches.map(m => ({ ...m, score1: null, score2: null, status: 'pending' }));
    } else if (sportConfig.engine === 'custom-cricket') {
      initializedMatches = matches.map(m => ({ ...m, team1Score: null, team2Score: null, format, status: 'pending' }));
    } else {
      initializedMatches = matches;
    }

    const tournament = {
      id: Date.now(),
      name: name.trim(),
      teams,
      matches: initializedMatches,
      format,
      createdAt: new Date().toISOString(),
      mode: 'tournament',
    };

    saveSportTournament(sportConfig.storageKey, tournament);
    navigate(`/${sport}/tournament/${tournament.id}`);
  };

  if (!sportConfig) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Sport not found</p>
      </div>
    );
  }

  if (!format) {
    return null; // Wait for format initialization
  }

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8" aria-label="Breadcrumb">
          <button
            onClick={() => navigate('/')}
            className="text-sm bg-transparent border-none cursor-pointer font-swiss"
            style={{ color: '#888' }}
          >
            Home
          </button>
          <span style={{ color: '#ccc' }} aria-hidden="true">/</span>
          <span className="text-sm" style={{ color: '#111' }} aria-current="page">
            {sportConfig.name} Tournament
          </span>
        </nav>

        <h1 className="text-xl font-semibold tracking-tight mb-8" style={{ color: '#111' }}>
          New Tournament
        </h1>

        {/* Step 1: Name + Format + Team Count */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Tournament Name */}
            <div className="mb-8">
              <label htmlFor="tournament-name" className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                Tournament name
              </label>
              <input
                id="tournament-name"
                type="text"
                className="mono-input text-lg"
                placeholder={isCricket ? 'Weekend Cricket League' : 'Volleyball Championship'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Format */}
            {sportConfig.engine === 'custom-cricket' && (
              <div className="mb-8">
                <span id="overs-label" className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Overs per innings
                </span>

                <div className="flex gap-2 flex-wrap mb-3">
                  {OVERS_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setFormat({ overs: preset.value });
                        setCustomOvers('');
                      }}
                      className={format.overs === preset.value ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="custom-overs" className="text-xs" style={{ color: '#888' }}>Custom:</label>
                  <input
                    id="custom-overs"
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
              </div>
            )}

            {/* Sets-based format */}
            {sportConfig.engine === 'sets' && sportConfig.config.setFormats && (
              <div className="mb-8">
                <span id="format-label" className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Format
                </span>
                <div className="flex gap-2 flex-wrap">
                  {sportConfig.config.setFormats.map((formatOption, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFormat({ sets: formatOption.sets, points: sportConfig.config.pointsPerSet })}
                      className={format.sets === formatOption.sets ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                    >
                      {formatOption.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team Count */}
            <fieldset className="mb-10" style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888', padding: 0 }}>
                Number of teams
              </legend>
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
                Will generate {teamCount === 2 ? '1 match' : `${(teamCount * (teamCount - 1)) / 2} matches`}
                {teamCount === 2 && ' (single elimination)'}
                {teamCount >= 3 && ' (round-robin format)'}
              </p>
            </fieldset>

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
                <span className="text-xs uppercase tracking-widest font-normal" style={{ color: '#888' }}>
                  Team names
                </span>
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
                      aria-label={`Team ${i + 1} name`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              className="mono-btn-primary w-full"
              style={{ padding: '12px', fontSize: '0.9375rem' }}
            >
              Next: Add Players (Optional)
            </button>
          </div>
        )}

        {/* Step 3: Player Roster (Optional) + Summary */}
        {step === 3 && (
          <div className="animate-fade-in">
            {/* Player Roster Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-normal" style={{ color: '#888' }}>
                  Add Players (Optional)
                </span>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                  style={{ color: '#0066ff' }}
                >
                  Back
                </button>
              </div>

              {teams.map((team, idx) => (
                <div key={team.id} className="mono-card p-4 mb-3">
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#111' }}>{team.name}</h4>

                  {team.members.map((member, mIdx) => (
                    <div key={mIdx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={member}
                        onChange={(e) => updateMember(idx, mIdx, e.target.value)}
                        className="mono-input flex-1"
                        placeholder={`Player ${mIdx + 1}`}
                        aria-label={`Player ${mIdx + 1} name for ${team.name}`}
                      />
                      <button
                        onClick={() => removeMember(idx, mIdx)}
                        className="text-xs bg-transparent border-none cursor-pointer"
                        style={{ color: '#dc2626' }}
                        aria-label={`Remove player ${mIdx + 1} from ${team.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => addMember(idx)}
                    className="mono-btn w-full mt-2"
                  >
                    + Add Player
                  </button>
                </div>
              ))}
            </div>

            <hr className="mono-divider mb-8" />

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
                    {isCricket && `${format.overs} overs`}
                    {sportConfig.engine === 'sets' && `Best of ${format.sets}`}
                    {sportConfig.engine === 'goals' && 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Teams</span>
                  <span className="font-mono" style={{ color: '#111' }}>{teamCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Matches</span>
                  <span className="font-mono" style={{ color: '#111' }}>
                    {teamCount === 2 ? 1 : (teamCount * (teamCount - 1)) / 2}
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
