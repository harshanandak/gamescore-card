import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveSportTournament } from '../../utils/storage';
import { generateRoundRobinMatches } from '../../utils/roundRobin';
import { getSportById } from '../../models/sportRegistry';
import { OVERS_PRESETS } from '../../utils/cricketCalculations';
import { getSportDefaults, applyStandardDefaults } from '../../utils/sportDefaults';

export default function MonoTournamentSetup() {
  const navigate = useNavigate();
  const { sport } = useParams();
  const sportConfig = getSportById(sport);

  const [step, setStep] = useState(1);
  const [formatMode, setFormatMode] = useState('standard');
  const [name, setName] = useState('');
  const [tournamentType, setTournamentType] = useState(null); // Start with no selection for progressive disclosure
  const [seriesGames, setSeriesGames] = useState(3);
  const [teamCount, setTeamCount] = useState(4);
  const [teams, setTeams] = useState([]);
  const [format, setFormat] = useState(null);
  const [customOvers, setCustomOvers] = useState('');
  const [showCustomOvers, setShowCustomOvers] = useState(false);
  const [visible, setVisible] = useState(true);

  const isCricket = sportConfig?.engine === 'custom-cricket';

  // Initialize format based on sport and format mode
  React.useEffect(() => {
    if (!sportConfig || format !== null) return;

    if (formatMode === 'standard') {
      // Apply standard defaults from sportDefaults.js
      const defaults = getSportDefaults(sport);
      if (defaults && Object.keys(defaults).length > 0) {
        setFormat(applyStandardDefaults(sport, {}));
      } else {
        // Fallback to custom defaults if no standard defaults found
        if (sportConfig.engine === 'custom-cricket') {
          setFormat({ overs: 5, players: 6, solo: true });
        } else if (sportConfig.engine === 'sets') {
          setFormat({ type: 'best-of', sets: 3, points: sportConfig.config.pointsPerSet });
        } else if (sportConfig.engine === 'goals') {
          setFormat({ mode: 'free' });
        }
      }
    } else {
      // Custom mode: use minimal defaults
      if (sportConfig.engine === 'custom-cricket') {
        setFormat({ overs: 5, players: 6, solo: true });
      } else if (sportConfig.engine === 'sets') {
        setFormat({ type: 'best-of', sets: 3, points: sportConfig.config.pointsPerSet });
      } else if (sportConfig.engine === 'goals') {
        setFormat({ mode: 'free' });
      }
    }
  }, [sportConfig, format, formatMode, sport]);

  // Apply standard defaults when format mode changes to 'standard'
  React.useEffect(() => {
    if (formatMode === 'standard' && sport && format) {
      const defaults = getSportDefaults(sport);
      if (defaults && Object.keys(defaults).length > 0) {
        setFormat(applyStandardDefaults(sport, {}));
      }
    }
  }, [formatMode, sport]);

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

    // Generate matches based on tournament type
    let matches;
    if (tournamentType === 'series') {
      // Series: generate N matches with same 2 teams
      matches = Array.from({ length: seriesGames }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        team1Id: teams[0].id,
        team2Id: teams[1].id,
        status: 'pending',
      }));
    } else if (teamCount === 2) {
      // Single match for 2-team round-robin
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
      type: tournamentType,
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
                placeholder={isCricket ? 'Weekend Cricket League' : `${sportConfig.name} Championship`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Tournament Type */}
            <div className="mb-8">
              <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                Tournament type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTournamentType('round-robin');
                    setTeamCount(4);
                  }}
                  className={tournamentType === 'round-robin' ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  Round-robin
                </button>
                <button
                  onClick={() => {
                    setTournamentType('series');
                    setTeamCount(2);
                  }}
                  className={tournamentType === 'series' ? 'mono-btn-primary' : 'mono-btn'}
                  style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                >
                  Series
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: '#bbb' }}>
                {tournamentType === 'round-robin'
                  ? 'Multiple teams, everyone plays everyone'
                  : '2 teams compete in a series of matches'}
              </p>
            </div>

            {/* Format Mode Toggle - Only show after Tournament Type is selected */}
            {tournamentType && (
              <div className="mb-8">
                <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Format Mode
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormatMode('standard')}
                    className={formatMode === 'standard' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setFormatMode('custom')}
                    className={formatMode === 'custom' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    Custom
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: '#bbb' }}>
                  {formatMode === 'standard'
                    ? 'Official rules for this sport'
                    : 'Customize all format options'}
                </p>
              </div>
            )}

            {/* Team Count (Round-robin only) */}
            {tournamentType === 'round-robin' && (
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
                  {teamCount === 2 && ' (series)'}
                  {teamCount >= 3 && ' (round-robin format)'}
                </p>
              </fieldset>
            )}

            {/* Series Length (Series only) */}
            {tournamentType === 'series' && (
              <div className="mb-10">
                <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Matches in series
                </span>
                <div className="flex gap-2">
                  {[1, 3, 5, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setSeriesGames(n)}
                      className={seriesGames === n ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                    >
                      {n === 1 ? '1 match' : `${n} matches`}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: '#888' }}>
                  {seriesGames === 1 ? 'Single match series' : `${seriesGames}-match series`}
                </p>
              </div>
            )}

            <hr className="mono-divider mb-8" />

            {/* Format options - Only show in Custom mode */}
            {formatMode === 'custom' && sportConfig.engine === 'custom-cricket' && (
              <div className="mb-8">
                <span id="overs-label" className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Overs per innings
                </span>

                <div className="flex gap-2 flex-wrap mb-3">
                  <button
                    onClick={() => {
                      setFormat(prev => ({ ...prev, overs: null }));
                      setCustomOvers('');
                      setShowCustomOvers(false);
                    }}
                    className={!format.overs && !showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  >
                    No limit
                  </button>
                  {OVERS_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setFormat(prev => ({ ...prev, overs: preset.value }));
                        setCustomOvers('');
                        setShowCustomOvers(false);
                      }}
                      className={format.overs === preset.value && !showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowCustomOvers(true);
                      setCustomOvers('');
                    }}
                    className={showCustomOvers ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom overs input (only shown when Custom selected) */}
                {showCustomOvers && (
                  <div className="flex items-center gap-2 mb-6">
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
                        if (v >= 1 && v <= 50) setFormat(prev => ({ ...prev, overs: v }));
                      }}
                      autoFocus
                    />
                    <span className="text-xs" style={{ color: '#888' }}>overs</span>
                  </div>
                )}

                {/* Cricket: Players per team */}
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    Players per team
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFormat(prev => ({ ...prev, players: Math.max(2, (prev.players || 6) - 1) }))}
                      className="mono-btn"
                      style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 700 }}
                      disabled={format.players <= 2}
                    >
                      &minus;
                    </button>
                    <span className="text-2xl font-bold font-mono" style={{ color: '#111', minWidth: '36px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {format.players || 6}
                    </span>
                    <button
                      onClick={() => {
                        const maxPlayers = format.solo ? 10 : 11;
                        setFormat(prev => ({ ...prev, players: Math.min(maxPlayers, (prev.players || 6) + 1) }));
                      }}
                      className="mono-btn"
                      style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem', fontWeight: 700 }}
                      disabled={format.players >= (format.solo ? 10 : 11)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Cricket: Batting style */}
                <div className="mb-8">
                  <label className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    Batting
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormat(prev => ({ ...prev, solo: true, players: Math.min(prev.players || 6, 10) }))}
                      className={format.solo ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                    >
                      One side
                    </button>
                    <button
                      onClick={() => setFormat(prev => ({ ...prev, solo: false }))}
                      className={!format.solo ? 'mono-btn-primary' : 'mono-btn'}
                      style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                    >
                      Both sides
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#bbb' }}>
                    {format.solo
                      ? `One team bats, other bowls · ${(format.players || 6) - 1} wickets`
                      : `Teams bat & bowl · ${(format.players || 6) - 1} wickets`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Goals-based format - Only show in Custom mode */}
            {formatMode === 'custom' && sportConfig.engine === 'goals' && (
              <div className="mb-8">
                <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Match mode
                </span>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setFormat({ mode: 'free' })}
                    className={format.mode === 'free' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    Free play
                  </button>
                  <button
                    onClick={() => setFormat({ mode: 'timed', timeLimit: sportConfig.config.timePresets?.[0]?.value || 1800 })}
                    className={format.mode === 'timed' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    By time
                  </button>
                  <button
                    onClick={() => setFormat({ mode: 'points', target: sportConfig.config.pointPresets?.[0] || 10 })}
                    className={format.mode === 'points' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    By points
                  </button>
                </div>

                {/* Time presets (conditional on "By time") */}
                {format.mode === 'timed' && (
                  <div className="mt-6">
                    <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                      Time limit
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {(sportConfig?.config?.timePresets || [
                        { label: '10 min', value: 600 },
                        { label: '20 min', value: 1200 },
                        { label: '30 min', value: 1800 },
                      ]).map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => setFormat({ mode: 'timed', timeLimit: opt.value })}
                          className={format.timeLimit === opt.value ? 'mono-btn-primary' : 'mono-btn'}
                          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Points target (conditional on "By points") */}
                {format.mode === 'points' && (
                  <div className="mt-6">
                    <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                      First to
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {(sportConfig.config.pointPresets || [5, 10, 15, 20]).map(pts => (
                        <button
                          key={pts}
                          onClick={() => setFormat({ mode: 'points', target: pts })}
                          className={format.target === pts ? 'mono-btn-primary' : 'mono-btn'}
                          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                        >
                          {pts} {sportConfig.config.scoringUnit || 'point'}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sets-based format - Only show in Custom mode */}
            {formatMode === 'custom' && sportConfig.engine === 'sets' && sportConfig.config.setFormats && (
              <div className="mb-8">
                <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                  Format
                </span>

                {/* Format type toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setFormat({ type: 'best-of', sets: 3, points: sportConfig.config.pointsPerSet })}
                    className={format.type === 'best-of' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    Best-of
                  </button>
                  <button
                    onClick={() => setFormat({ type: 'single', sets: 1, points: 15 })}
                    className={format.type === 'single' ? 'mono-btn-primary' : 'mono-btn'}
                    style={{ padding: '8px 16px', fontSize: '0.8125rem', flex: 1 }}
                  >
                    Single set
                  </button>
                </div>

                {/* Best-of set count (conditional) */}
                {format.type === 'best-of' && (
                  <div className="mt-6">
                    <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                      Sets
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {sportConfig.config.setFormats.map((formatOption, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormat(prev => ({ ...prev, sets: formatOption.sets }))}
                          className={format.sets === formatOption.sets ? 'mono-btn-primary' : 'mono-btn'}
                          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                        >
                          {formatOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Points to win */}
                <div className="mt-6">
                  <span className="text-xs uppercase tracking-widest font-normal mb-3 block" style={{ color: '#888' }}>
                    Points to win
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {[10, 15, 21, 25].map(pts => (
                      <button
                        key={pts}
                        onClick={() => setFormat(prev => ({ ...prev, points: pts }))}
                        className={format.points === pts ? 'mono-btn-primary' : 'mono-btn'}
                        style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
                      >
                        {pts} pts
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                  <span style={{ color: '#888' }}>Type</span>
                  <span className="font-mono" style={{ color: '#111' }}>
                    {tournamentType === 'series' ? `${seriesGames}-match series` : 'Round-robin'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Format</span>
                  <span className="font-mono text-right" style={{ color: '#111', maxWidth: '200px' }}>
                    {isCricket && `${format.overs ? `${format.overs} ov` : 'No limit'} · ${format.players}p · ${format.solo ? 'One side' : 'Both sides'}`}
                    {sportConfig.engine === 'sets' && (format.type === 'best-of' ? `Best of ${format.sets} · ${format.points} pts` : `Single set · ${format.points} pts`)}
                    {sportConfig.engine === 'goals' && (
                      format.mode === 'free' ? 'Free play' :
                      format.mode === 'timed' ? `${Math.floor(format.timeLimit / 60)} min` :
                      `First to ${format.target}`
                    )}
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
