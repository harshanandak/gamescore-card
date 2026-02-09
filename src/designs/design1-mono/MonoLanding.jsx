import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCricketTournaments, loadVolleyballTournaments, loadData } from '../../utils/storage';

const QM_KEY = 'gamescore_quickmatches';

export default function MonoLanding() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [stats, setStats] = useState({ tournaments: 0, matches: 0, quickMatches: 0 });

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
      <nav className="px-6 py-5">
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
        <section className="px-6 pb-10">
          <div className="max-w-3xl mx-auto">
            <div
              className="mono-card flex items-center justify-between"
              style={{ padding: '14px 20px', borderLeft: '3px solid #0066ff' }}
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

      <hr className="mono-divider max-w-3xl mx-auto" />

      {/* ─── Sports ─── */}
      <section id="sports" className="px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-xs uppercase tracking-widest font-normal mb-10 text-center"
            style={{ color: '#888' }}
          >
            Choose your game
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cricket */}
            <SportCard
              icon={'\u{1F3CF}'}
              name="Cricket"
              features={['Custom overs (1\u201350)', 'NRR points table', 'Ball-by-ball quick match', 'Wickets, extras, all-out']}
              onTournament={() => navigate('/cricket/tournament')}
              onQuick={() => navigate('/cricket/quick')}
            />

            {/* Volleyball */}
            <SportCard
              icon={'\u{1F3D0}'}
              name="Volleyball"
              features={['First to 10 / 15 / 21 / 25', 'Win by 2 at deuce', 'Tap-to-score quick match', 'Standings with +/\u2212']}
              onTournament={() => navigate('/volleyball/tournament')}
              onQuick={() => navigate('/volleyball/quick')}
            />
          </div>

          {/* More sports teaser */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/setup')}
              className="text-xs bg-transparent border-none cursor-pointer font-swiss"
              style={{ color: '#0066ff' }}
            >
              More sports (generic scorer) &rarr;
            </button>
            <p className="text-xs mt-1" style={{ color: '#bbb' }}>
              Badminton, Table Tennis, Football, Basketball
            </p>
          </div>
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
          <span className="text-3xl">{icon}</span>
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
