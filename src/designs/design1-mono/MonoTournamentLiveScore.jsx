import React from 'react';
import { useParams } from 'react-router-dom';
import { getSportById } from '../../models/sportRegistry';
import MonoSetsLiveScore from './scoring/MonoSetsLiveScore';
import MonoGoalsLiveScore from './scoring/MonoGoalsLiveScore';

export default function MonoTournamentLiveScore() {
  const { sport } = useParams();
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

  // Cricket will be added in Phase 4
  return (
    <div className="min-h-screen px-6 py-10 flex items-center justify-center">
      <p style={{ color: '#888' }}>Live scoring for {sportConfig.name} coming soon...</p>
    </div>
  );
}
