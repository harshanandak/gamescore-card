import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MonoLanding from './MonoLanding';
import MonoSportHome from './MonoSportHome';
import MonoSetup from './MonoSetup';
import MonoLiveGame from './MonoLiveGame';
import MonoHistory from './MonoHistory';
import MonoTournamentList from './MonoTournamentList';
import MonoTournamentSetup from './MonoTournamentSetup';
import MonoCricketTournament from './MonoCricketTournament';
import MonoVolleyballTournament from './MonoVolleyballTournament';
import MonoQuickMatch from './MonoQuickMatch';
import MonoStatistics from './MonoStatistics';
import './mono.css';

export default function Design1Mono() {
  return (
    <div className="min-h-screen font-swiss" style={{ background: '#fafafa', color: '#111' }}>
      <Routes>
        {/* Landing page */}
        <Route path="" element={<MonoLanding />} />

        {/* Sport picker (secondary) */}
        <Route path="play" element={<MonoSportHome />} />

        {/* Cricket routes */}
        <Route path="cricket/tournament" element={<MonoTournamentList />} />
        <Route path="cricket/tournament/new" element={<MonoTournamentSetup />} />
        <Route path="cricket/tournament/:id" element={<MonoCricketTournament />} />
        <Route path="cricket/quick" element={<MonoQuickMatch />} />

        {/* Volleyball routes */}
        <Route path="volleyball/tournament" element={<MonoTournamentList />} />
        <Route path="volleyball/tournament/new" element={<MonoTournamentSetup />} />
        <Route path="volleyball/tournament/:id" element={<MonoVolleyballTournament />} />
        <Route path="volleyball/quick" element={<MonoQuickMatch />} />

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
