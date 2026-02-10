import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCricketTournaments, loadVolleyballTournaments, loadData } from '../../utils/storage';
import { getSportsByCategory, getSportById } from '../../models/sportRegistry';

const QM_KEY = 'gamescore_quickmatches';

export default function MonoLanding() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState({ tournaments: 0, matches: 0, quickMatches: 0 });
  const [selectedSport, setSelectedSport] = useState(null);

  const SPORT_CATEGORIES = getSportsByCategory();

  // Top 6 featured sports
  const featuredSports = [
    getSportById('cricket'),
    getSportById('volleyball'),
    getSportById('badminton'),
    getSportById('football'),
    getSportById('basketball'),
    getSportById('tabletennis'),
  ];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const cricket = loadCricketTournaments();
    const volleyball = loadVolleyballTournaments();
    const qm = loadData(QM_KEY, []);

    let matchCount = 0;
    cricket.forEach(t => { matchCount += t.matches?.filter(m => m.status === 'completed' || m.team1Score).length || 0; });
    volleyball.forEach(t => { matchCount += t.matches?.filter(m => m.score1 !== null && m.score1 !== undefined).length || 0; });

    setStats({
      tournaments: cricket.length + volleyball.length,
      matches: matchCount + qm.length,
      quickMatches: qm.length,
    });
  }, []);

  const hasData = stats.tournaments > 0 || stats.matches > 0;

  return (
    <div className={`min-h-screen mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>

      {/* ─── Nav ─── */}
      <nav className="px-6 py-5" aria-label="Main navigation">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight" style={{ color: '#111' }}>
              GameScore
            </span>
            <span className="text-xs font-mono" style={{ color: '#bbb' }}>card</span>
          </div>
          <div className="flex items-center gap-4">
            {hasData && (
              <button
                onClick={() => navigate('/statistics')}
                className="text-xs bg-transparent border-none cursor-pointer font-swiss"
                style={{ color: '#888' }}
              >
                Statistics
              </button>
            )}
            <button
              onClick={() => navigate('/history')}
              className="text-xs bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#888' }}
            >
              History
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="px-6 pt-8 pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-widest font-normal mb-5"
            style={{ color: '#888' }}
          >
            Tournament scorecard for every sport
          </p>

          <h1
            className="font-semibold tracking-tight leading-tight mb-5"
            style={{ color: '#111', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)' }}
          >
            Score matches.<br />
            Track tournaments.<br />
            Know who won.
          </h1>

          <p
            className="text-base leading-relaxed mb-10 mx-auto"
            style={{ color: '#888', maxWidth: '420px' }}
          >
            Create a tournament, add your teams, and start scoring.
            Points tables, NRR, standings &mdash; calculated automatically.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/play')}
              className="mono-btn-primary"
              style={{ padding: '12px 32px', fontSize: '0.9375rem' }}
            >
              Start scoring
            </button>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mono-btn"
              style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* ─── Returning user: resume banner ─── */}
      {hasData && (
        <section className="px-6 pb-10" aria-label="Welcome back summary">
          <div className="max-w-3xl mx-auto">
            <div
              className="mono-card flex items-center justify-between"
              style={{ padding: '14px 20px', borderLeft: '3px solid #0066ff' }}
              role="status"
              aria-label={`${stats.tournaments} tournaments, ${stats.matches} matches played`}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#111' }}>
                  Welcome back
                </p>
                <p className="text-xs" style={{ color: '#888' }}>
                  {stats.tournaments} tournament{stats.tournaments !== 1 ? 's' : ''}
                  {' '}&middot; {stats.matches} match{stats.matches !== 1 ? 'es' : ''} played
                </p>
              </div>
              <button
                onClick={() => navigate('/statistics')}
                className="mono-btn"
                style={{ padding: '8px 16px', fontSize: '0.75rem' }}
              >
                View stats
              </button>
            </div>
          </div>
        </section>
      )}

      <hr className="mono-divider max-w-3xl mx-auto" />

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-10 text-center"
            style={{ color: '#888' }}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <StepCard
              number="1"
              title="Pick a sport"
              desc="Choose from 14 sports. Select tournament mode or start a quick match."
            />
            <StepCard
              number="2"
              title="Set up teams"
              desc="Name your tournament, choose the format, and add 2 to 8 teams with optional player rosters."
            />
            <StepCard
              number="3"
              title="Enter scores"
              desc="Tap any match to enter scores. Points table and standings update instantly."
            />
          </div>
        </div>
      </section>

      <hr className="mono-divider max-w-6xl mx-auto" />

      {/* ─── Top Sports ─── */}
      <section id="sports" className="px-4 sm:px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-10 text-center"
            style={{ color: '#888' }}
          >
            Top Sports
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSports.map(sport => (
              <SportCard
                key={sport.id}
                icon={sport.icon}
                name={sport.name}
                features={sport.features}
                onTournament={() => navigate(`/${sport.id}/tournament`)}
                onQuick={() => navigate(`/${sport.id}/quick`)}
              />
            ))}
          </div>
        </div>
      </section>

      <hr className="mono-divider max-w-6xl mx-auto" />

      {/* ─── Browse All Sports ─── */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-10 text-center px-4 sm:px-6"
            style={{ color: '#888' }}
          >
            Browse All 14 Sports
          </h2>

          {Object.entries(SPORT_CATEGORIES).map(([category, sports]) => (
            <div key={category} className="mb-8 last:mb-0">
              <h3 className="text-xs font-medium mb-4 px-4 sm:px-6" style={{ color: '#666' }}>
                {category}
              </h3>

              {/* Mobile: Horizontal scroll */}
              <div
                className="flex gap-3 overflow-x-auto pb-4 px-4 sm:hidden"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#ddd #fafafa',
                  scrollSnapType: 'x mandatory',
                }}
              >
                {sports.map(sport => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport)}
                    aria-label={`Select ${sport.name}`}
                    className="mono-card cursor-pointer hover:border-blue-200 transition-colors flex-shrink-0"
                    style={{
                      padding: '16px',
                      background: 'transparent',
                      border: '1px solid #eee',
                      width: '110px',
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-3xl mb-2" aria-hidden="true">{sport.icon}</span>
                      <p className="text-xs font-medium" style={{ color: '#111' }}>
                        {sport.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4 sm:px-6">
                {sports.map(sport => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport)}
                    aria-label={`Select ${sport.name}`}
                    className="mono-card cursor-pointer hover:border-blue-200 transition-colors"
                    style={{
                      padding: '16px',
                      background: 'transparent',
                      border: '1px solid #eee',
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="text-3xl mb-2" aria-hidden="true">{sport.icon}</span>
                      <p className="text-xs font-medium" style={{ color: '#111' }}>
                        {sport.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="text-center text-xs mt-8 px-4 sm:px-6" style={{ color: '#888' }}>
            Click any sport to see Tournament/Quick Match options
          </p>
        </div>
      </section>

      <hr className="mono-divider max-w-3xl mx-auto" />

      {/* ─── Features grid ─── */}
      <section className="px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-10 text-center"
            style={{ color: '#888' }}
          >
            Features
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FeatureCard label="Round Robin" desc="Auto-generated fixtures" />
            <FeatureCard label="Points Table" desc="Live standings + NRR" />
            <FeatureCard label="Quick Match" desc="Score without setup" />
            <FeatureCard label="Share Results" desc="Copy to clipboard" />
            <FeatureCard label="Offline" desc="Works without internet" />
            <FeatureCard label="Auto-Save" desc="Never lose your data" />
            <FeatureCard label="Mobile First" desc="Built for phones" />
            <FeatureCard label="Statistics" desc="Cross-sport stats" />
          </div>
        </div>
      </section>

      <hr className="mono-divider max-w-3xl mx-auto" />

      {/* ─── CTA ─── */}
      <section className="px-6 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-lg font-semibold tracking-tight mb-3"
            style={{ color: '#111' }}
          >
            Ready to play?
          </h2>
          <p className="text-sm mb-8" style={{ color: '#888' }}>
            No account needed. Your data saves locally on this device.
          </p>
          <button
            onClick={() => navigate('/play')}
            className="mono-btn-primary"
            style={{ padding: '12px 40px', fontSize: '0.9375rem' }}
          >
            Start scoring
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid #eee' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-xs" style={{ color: '#bbb' }}>
            GameScore Card
          </p>
          <p className="text-xs font-mono" style={{ color: '#ccc' }}>
            v1.0
          </p>
        </div>
      </footer>

      {/* Sport Selection Modal */}
      {selectedSport && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedSport(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedSport.name} game mode selection`}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl" aria-hidden="true">{selectedSport.icon}</span>
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
                  setSelectedSport(null);
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
                  setSelectedSport(null);
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

            <button
              onClick={() => setSelectedSport(null)}
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


/* ─── Sub-components ─── */

function StepCard({ number, title, desc }) {
  return (
    <div className="text-center sm:text-left">
      <div
        className="inline-flex items-center justify-center w-8 h-8 mb-3 font-mono text-sm font-bold"
        style={{
          color: '#0066ff',
          border: '1px solid #0066ff',
          borderRadius: '50%',
        }}
      >
        {number}
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: '#111' }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
        {desc}
      </p>
    </div>
  );
}

function SportCard({ icon, name, features, onTournament, onQuick }) {
  return (
    <div className="mono-card" style={{ padding: 0 }}>
      <div style={{ padding: '24px 24px 16px' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl" aria-hidden="true">{icon}</span>
          <h3 className="text-lg font-semibold" style={{ color: '#111' }}>
            {name}
          </h3>
        </div>

        <ul className="mb-5" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 mb-1.5 text-xs"
              style={{ color: '#666' }}
            >
              <span style={{ color: '#0066ff', flexShrink: 0, marginTop: '1px' }}>&bull;</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="flex gap-2"
        style={{ padding: '0 24px 20px' }}
      >
        <button
          onClick={onTournament}
          className="mono-btn-primary flex-1"
          style={{ padding: '10px 16px', fontSize: '0.8125rem' }}
        >
          Tournament
        </button>
        <button
          onClick={onQuick}
          className="mono-btn flex-1"
          style={{ padding: '10px 16px', fontSize: '0.8125rem' }}
        >
          Quick Match
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ label, desc }) {
  return (
    <div
      className="mono-card text-center"
      style={{ padding: '20px 12px' }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: '#111' }}>
        {label}
      </p>
      <p className="text-xs" style={{ color: '#888' }}>
        {desc}
      </p>
    </div>
  );
}
