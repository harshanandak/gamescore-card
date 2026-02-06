import React, { useState } from 'react';
import GameSelector from './components/GameSelector';
import VolleyballTracker from './components/volleyball/VolleyballTracker';
import CricketNRR from './components/cricket/CricketNRR';
import Statistics from './components/Statistics';

export default function App() {
  const [currentView, setCurrentView] = useState({ type: 'home' });

  const handleSelectGame = (sport, mode) => {
    setCurrentView({ type: 'game', sport, mode });
  };

  const handleShowStatistics = () => {
    setCurrentView({ type: 'statistics' });
  };

  const handleBack = () => {
    setCurrentView({ type: 'home' });
  };

  // Statistics view
  if (currentView.type === 'statistics') {
    return <Statistics onBack={handleBack} />;
  }

  // Game views
  if (currentView.type === 'game') {
    if (currentView.sport === 'cricket') {
      return <CricketNRR onBack={handleBack} mode={currentView.mode} />;
    }
    if (currentView.sport === 'volleyball') {
      return <VolleyballTracker onBack={handleBack} mode={currentView.mode} />;
    }
  }

  // Home view
  return (
    <GameSelector
      onSelectGame={handleSelectGame}
      onShowStatistics={handleShowStatistics}
    />
  );
}
