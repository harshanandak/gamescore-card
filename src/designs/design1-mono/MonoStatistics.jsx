import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadCricketTournaments, loadVolleyballTournaments, loadData } from '../../utils/storage';

const QM_KEY = 'gamescore_quickmatches';

export default function MonoStatistics() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState('overview');
  const [cricketData, setCricketData] = useState({ tournaments: 0, matches: 0, teams: new Set() });
  const [volleyballData, setVolleyballData] = useState({ tournaments: 0, matches: 0, teams: new Set() });
  const [quickMatches, setQuickMatches] = useState([]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const cricket = loadCricketTournaments();
    const volleyball = loadVolleyballTournaments();
    const qm = loadData(QM_KEY, []);
    setQuickMatches(qm);

    // Cricket stats
    let cMatches = 0;
    const cTeams = new Set();
    cricket.forEach(t => {
      cMatches += t.matches?.filter(m => m.status === 'completed' || m.team1Score).length || 0;
      t.teams?.forEach(team => cTeams.add(team.name));
    });
    setCricketData({ tournaments: cricket.length, matches: cMatches, teams: cTeams });

    // Volleyball stats
    let vMatches = 0;
    const vTeams = new Set();
    volleyball.forEach(t => {
      vMatches += t.matches?.filter(m => m.score1 !== null && m.score1 !== undefined).length || 0;
      t.teams?.forEach(team => vTeams.add(team.name));
    });
    setVolleyballData({ tournaments: volleyball.length, matches: vMatches, teams: vTeams });
  }, []);

  const totalTournaments = cricketData.tournaments + volleyballData.tournaments;
  const totalMatches = cricketData.matches + volleyballData.matches + quickMatches.length;
  const totalTeams = new Set([...cricketData.teams, ...volleyballData.teams]).size;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cricket', label: 'Cricket' },
    { id: 'volleyball', label: 'Volleyball' },
    { id: 'quick', label: 'Quick' },
  ];

  return (
    <div className={`min-h-screen px-6 py-10 mono-transition ${visible ? 'mono-visible' : 'mono-hidden'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => navigate('/')} className="text-sm bg-transparent border-none cursor-pointer font-swiss" style={{ color: '#888' }}>
            \u2190 Home
          </button>
        </div>

        <h1 className="text-xl font-semibold tracking-tight mb-8" style={{ color: '#111' }}>
          Statistics
        </h1>

        {/* Tabs */}
        <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid #eee' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="bg-transparent border-none cursor-pointer font-swiss px-4 py-3 text-sm"
              style={{
                color: tab === t.id ? '#0066ff' : '#888',
                borderBottom: tab === t.id ? '2px solid #0066ff' : '2px solid transparent',
                fontWeight: tab === t.id ? 500 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <StatCard label="Tournaments" value={totalTournaments} />
              <StatCard label="Matches" value={totalMatches} />
              <StatCard label="Teams" value={totalTeams} />
            </div>

            <hr className="mono-divider mb-6" />

            <div className="flex flex-col gap-3">
              <div className="mono-card flex items-center justify-between" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{'\u{1F3CF}'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#111' }}>Cricket</p>
                    <p className="text-xs" style={{ color: '#888' }}>
                      {cricketData.tournaments} tournaments &middot; {cricketData.matches} matches
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm" style={{ color: '#888' }}>
                  {cricketData.teams.size} teams
                </span>
              </div>

              <div className="mono-card flex items-center justify-between" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{'\u{1F3D0}'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#111' }}>Volleyball</p>
                    <p className="text-xs" style={{ color: '#888' }}>
                      {volleyballData.tournaments} tournaments &middot; {volleyballData.matches} matches
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm" style={{ color: '#888' }}>
                  {volleyballData.teams.size} teams
                </span>
              </div>

              <div className="mono-card flex items-center justify-between" style={{ padding: '16px 20px' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{'\u26A1'}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#111' }}>Quick Matches</p>
                    <p className="text-xs" style={{ color: '#888' }}>
                      {quickMatches.length} matches played
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cricket */}
        {tab === 'cricket' && (
          <div>
            {cricketData.tournaments === 0 ? (
              <EmptyState icon={'\u{1F3CF}'} label="No cricket data yet" />
            ) : (
              <TeamStatsTable sport="cricket" />
            )}
          </div>
        )}

        {/* Volleyball */}
        {tab === 'volleyball' && (
          <div>
            {volleyballData.tournaments === 0 ? (
              <EmptyState icon={'\u{1F3D0}'} label="No volleyball data yet" />
            ) : (
              <TeamStatsTable sport="volleyball" />
            )}
          </div>
        )}

        {/* Quick Matches */}
        {tab === 'quick' && (
          <div>
            {quickMatches.length === 0 ? (
              <EmptyState icon={'\u26A1'} label="No quick matches yet" />
            ) : (
              <div className="flex flex-col gap-2">
                {quickMatches.map(qm => (
                  <div key={qm.id} className="mono-card" style={{ padding: '12px 16px' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: '#111' }}>
                        {qm.team1} vs {qm.team2}
                      </span>
                      <span className="text-xs font-mono" style={{ color: '#888' }}>
                        {qm.score1 !== undefined
                          ? `${qm.score1}-${qm.score2}`
                          : `${qm.team1Score?.runs}/${qm.team1Score?.wickets} vs ${qm.team2Score?.runs}/${qm.team2Score?.wickets}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: '#0066ff' }}>{qm.winner}</span>
                      <span className="text-xs" style={{ color: '#bbb' }}>
                        {new Date(qm.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="mono-card text-center" style={{ padding: '16px 12px' }}>
      <p className="text-2xl font-bold font-mono mono-score" style={{ color: '#111' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#888' }}>{label}</p>
    </div>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '20vh' }}>
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm" style={{ color: '#888' }}>{label}</p>
    </div>
  );
}

function TeamStatsTable({ sport }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const tournaments = sport === 'cricket'
      ? loadCricketTournaments()
      : loadVolleyballTournaments();

    const teamMap = {};

    tournaments.forEach(t => {
      t.teams?.forEach(team => {
        if (!teamMap[team.name]) {
          teamMap[team.name] = { name: team.name, played: 0, won: 0, lost: 0 };
        }
      });

      t.matches?.forEach(match => {
        if (sport === 'cricket') {
          if (match.status !== 'completed' && !match.team1Score) return;
          const t1 = t.teams?.find(te => te.id === match.team1Id)?.name;
          const t2 = t.teams?.find(te => te.id === match.team2Id)?.name;
          if (!t1 || !t2 || !teamMap[t1] || !teamMap[t2]) return;

          teamMap[t1].played++;
          teamMap[t2].played++;

          const s1 = match.team1Score?.runs || 0;
          const s2 = match.team2Score?.runs || 0;
          if (s1 > s2) { teamMap[t1].won++; teamMap[t2].lost++; }
          else if (s2 > s1) { teamMap[t2].won++; teamMap[t1].lost++; }
        } else {
          if (match.score1 === null || match.score1 === undefined) return;
          const idx1 = match.team1Id ?? match.team1;
          const idx2 = match.team2Id ?? match.team2;
          const t1 = typeof idx1 === 'number' ? t.teams?.[idx1]?.name : t.teams?.find(te => te.id === idx1)?.name;
          const t2 = typeof idx2 === 'number' ? t.teams?.[idx2]?.name : t.teams?.find(te => te.id === idx2)?.name;
          if (!t1 || !t2 || !teamMap[t1] || !teamMap[t2]) return;

          teamMap[t1].played++;
          teamMap[t2].played++;
          if (match.score1 > match.score2) { teamMap[t1].won++; teamMap[t2].lost++; }
          else { teamMap[t2].won++; teamMap[t1].lost++; }
        }
      });
    });

    setData(Object.values(teamMap).sort((a, b) => b.won - a.won));
  }, [sport]);

  if (data.length === 0) return <EmptyState icon={sport === 'cricket' ? '\u{1F3CF}' : '\u{1F3D0}'} label="No team data" />;

  return (
    <div className="mono-card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <th className="text-left font-normal" style={{ color: '#888', padding: '12px 16px' }}>Team</th>
            <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 8px' }}>P</th>
            <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 8px' }}>W</th>
            <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 8px' }}>L</th>
            <th className="text-center font-normal font-mono" style={{ color: '#888', padding: '12px 16px' }}>Win%</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.name} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td className="font-medium" style={{ color: '#111', padding: '12px 16px' }}>{row.name}</td>
              <td className="text-center font-mono" style={{ color: '#888', padding: '12px 8px' }}>{row.played}</td>
              <td className="text-center font-mono" style={{ color: '#111', padding: '12px 8px' }}>{row.won}</td>
              <td className="text-center font-mono" style={{ color: '#888', padding: '12px 8px' }}>{row.lost}</td>
              <td className="text-center font-mono" style={{ color: '#0066ff', padding: '12px 16px' }}>
                {row.played > 0 ? Math.round((row.won / row.played) * 100) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
