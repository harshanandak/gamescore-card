import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import MonoLanding from './MonoLanding';
import MonoSportHome from './MonoSportHome';
import MonoSetup from './MonoSetup';
import MonoLiveGame from './MonoLiveGame';
import MonoHistory from './MonoHistory';
import MonoTournamentList from './MonoTournamentList';
import MonoTournamentSetup from './MonoTournamentSetup';
import MonoCricketTournament from './MonoCricketTournament';
import MonoVolleyballTournament from './MonoVolleyballTournament';
import GenericSetsTournament from './GenericSetsTournament';
import GenericGoalsTournament from './GenericGoalsTournament';
import MonoQuickMatch from './MonoQuickMatch';
import MonoStatistics from './MonoStatistics';
import { getSportById } from '../../models/sportRegistry';
import './mono.css';

// Dispatcher component that routes to the correct tournament component based on engine
function TournamentDispatcher() {
  const { sport } = useParams();
  const sportConfig = getSportById(sport);

  if (!sportConfig) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Sport not found</p>
      </div>
    );
  }

  // Cricket uses custom component
  if (sportConfig.engine === 'custom-cricket') {
    return <MonoCricketTournament />;
  }

  // Sets-based sports use GenericSetsTournament
  if (sportConfig.engine === 'sets') {
    return <GenericSetsTournament />;
  }

  // Goals-based sports use GenericGoalsTournament
  if (sportConfig.engine === 'goals') {
    return <GenericGoalsTournament />;
  }

  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <p style={{ color: '#888' }}>Engine type not supported</p>
    </div>
  );
}

export default function Design1Mono() {
  return (
    <div className="min-h-screen font-swiss" style={{ background: '#fafafa', color: '#111' }}>
      <Routes>
        {/* Landing page */}
        <Route path="" element={<MonoLanding />} />

        {/* Sport picker (secondary) */}
        <Route path="play" element={<MonoSportHome />} />

        {/* Generic sport routes (works for all 14 sports) */}
        <Route path=":sport/tournament" element={<MonoTournamentList />} />
        <Route path=":sport/tournament/new" element={<MonoTournamentSetup />} />
        <Route path=":sport/tournament/:id" element={<TournamentDispatcher />} />
        <Route path=":sport/quick" element={<MonoQuickMatch />} />

        {/* Statistics */}
        <Route path="statistics" element={<MonoStatistics />} />

        {/* Generic game routes (existing) */}
        <Route path="setup" element={<MonoSetup />} />
        <Route path="game/:id" element={<MonoLiveGame />} />
        <Route path="history" element={<MonoHistory />} />
      </Routes>
    </div>
  );
}
