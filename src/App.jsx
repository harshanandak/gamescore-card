import React, { useState } from 'react';
import GameSelector from './components/GameSelector';
import VolleyballTracker from './components/volleyball/VolleyballTracker';
import CricketNRR from './components/cricket/CricketNRR';

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null);

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
  };

  const handleBack = () => {
    setSelectedGame(null);
  };

  // Render selected game or home screen
  if (selectedGame === 'cricket') {
    return <CricketNRR onBack={handleBack} />;
  }

  if (selectedGame === 'volleyball') {
    return <VolleyballTracker onBack={handleBack} />;
  }

  return <GameSelector onSelectGame={handleSelectGame} />;
}
