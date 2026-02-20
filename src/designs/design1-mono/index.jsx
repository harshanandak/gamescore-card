import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import MonoLanding from './MonoLanding';
import MonoSportHome from './MonoSportHome';
import MonoSetup from './MonoSetup';
import MonoLiveGame from './MonoLiveGame';
import MonoHistory from './MonoHistory';
import MonoTournamentList from './MonoTournamentList';
import MonoTournamentSetup from './MonoTournamentSetup';
import MonoQuickMatch from './MonoQuickMatch';
import MonoTournamentLiveScore from './MonoTournamentLiveScore';
import { getSportById } from '../../models/sportRegistry';
import './mono.css';

// Lazy-loaded tournament components (loaded on demand per sport type)
const MonoCricketTournament = lazy(() => import('./MonoCricketTournament'));
const GenericSetsTournament = lazy(() => import('./GenericSetsTournament'));
const GenericGoalsTournament = lazy(() => import('./GenericGoalsTournament'));
const MonoStatistics = lazy(() => import('./MonoStatistics'));
const MonoCricketTestLiveScore = lazy(() => import('./scoring/MonoCricketTestLiveScore'));

// Lazy-loaded showcase components (rarely visited)
const MonoMatchCardShowcase = lazy(() => import('./MonoMatchCardShowcase'));
const MonoSetDisplayShowcase = lazy(() => import('./MonoSetDisplayShowcase'));

function LazyFallback() {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading...</div>
  );
}

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
  const location = useLocation();

  // Browser back button protection for active game/scoring routes
  useEffect(() => {
    const isGameRoute = /\/(game\/|.*\/tournament\/\d+\/match\/.*\/score|.*\/quick)/.test(location.pathname);

    if (!isGameRoute) return;

    // Push a dummy history entry so back button triggers popstate
    window.history.pushState({ gameProtection: true }, '');

    const handlePopState = (e) => {
      const leave = window.confirm('Leave this page? Your unsaved scoring progress may be lost.');
      if (!leave) {
        // Re-push dummy entry to keep them on the page
        window.history.pushState({ gameProtection: true }, '');
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen font-swiss" style={{ background: '#fafafa', color: '#111' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <main id="main-content">
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            {/* Landing page */}
            <Route path="" element={<MonoLanding />} />

            {/* Sport picker (secondary) */}
            <Route path="play" element={<MonoSportHome />} />

            {/* Generic sport routes (works for all 14 sports) */}
            <Route path=":sport/tournament" element={<MonoTournamentList />} />
            <Route path=":sport/tournament/new" element={<MonoTournamentSetup />} />
            <Route path=":sport/tournament/:id" element={<TournamentDispatcher />} />
            <Route path=":sport/tournament/:id/match/:matchId/score" element={<MonoTournamentLiveScore />} />
            <Route path=":sport/quick" element={<MonoQuickMatch />} />
            <Route path=":sport/quick/test/:matchId" element={<MonoCricketTestLiveScore storageMode="quick" />} />

            {/* Statistics */}
            <Route path="statistics" element={<MonoStatistics />} />

            {/* Design showcase */}
            <Route path="showcase/match-card" element={<MonoMatchCardShowcase />} />
            <Route path="showcase/set-display" element={<MonoSetDisplayShowcase />} />

            {/* Generic game routes (existing) */}
            <Route path="setup" element={<MonoSetup />} />
            <Route path="game/:id" element={<MonoLiveGame />} />
            <Route path="history" element={<MonoHistory />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
