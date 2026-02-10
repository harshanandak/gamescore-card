import React from 'react';
import { useParams } from 'react-router-dom';
import { getSportById } from '../../models/sportRegistry';
import MonoSetsLiveScore from './scoring/MonoSetsLiveScore';
import MonoGoalsLiveScore from './scoring/MonoGoalsLiveScore';
import MonoCricketLiveScore from './scoring/MonoCricketLiveScore';
import MonoTennisLiveScore from './scoring/MonoTennisLiveScore';

export default function MonoTournamentLiveScore() {
  const { sport } = useParams();

  // Cricket uses custom-cricket engine and special handling
  if (sport === 'cricket') {
    return <MonoCricketLiveScore />;
  }

  // Tennis uses real tennis scoring (0-15-30-40-Game, deuce, tiebreak)
  if (sport === 'tennis') {
    return <MonoTennisLiveScore />;
  }

  const sportConfig = getSportById(sport);

  if (!sportConfig) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <p style={{ color: '#888' }}>Sport not found</p>
      </div>
    );
  }

  // Sets-based sports use MonoSetsLiveScore
  if (sportConfig.engine === 'sets') {
    return <MonoSetsLiveScore />;
  }

  // Goals-based sports use MonoGoalsLiveScore
  if (sportConfig.engine === 'goals') {
    return <MonoGoalsLiveScore />;
  }

  // Fallback
  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <p style={{ color: '#888' }}>Live scoring for {sportConfig?.name || sport} coming soon...</p>
    </div>
  );
}
