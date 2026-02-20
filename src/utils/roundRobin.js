// Round-robin tournament match generation (circle method)
// and knockout bracket generation

/**
 * Generate round-robin matches using the circle method (Berger tables).
 * Produces a schedule where no team plays in consecutive matches (for 4+ teams).
 * For odd team counts, a BYE placeholder is used and BYE matches are excluded.
 */
export function generateRoundRobinMatches(teams) {
  if (teams.length < 2) return [];

  const teamsCopy = [...teams];

  // Add BYE placeholder for odd number of teams
  if (teamsCopy.length % 2 !== 0) {
    teamsCopy.push({ id: '__BYE__', name: 'BYE' });
  }

  const n = teamsCopy.length;
  const rounds = n - 1;
  const halfSize = n / 2;

  // rotating = all teams except the first (which stays fixed)
  const rotating = teamsCopy.slice(1);

  const matches = [];
  const ts = Date.now();

  for (let round = 0; round < rounds; round++) {
    // Fixed team vs first in rotating array
    const roundPairs = [[teamsCopy[0], rotating[0]]];

    // Pair remaining from both ends
    for (let i = 1; i < halfSize; i++) {
      roundPairs.push([rotating[i], rotating[n - 1 - i]]);
    }

    // Add non-BYE matches
    for (const [t1, t2] of roundPairs) {
      if (t1.id !== '__BYE__' && t2.id !== '__BYE__') {
        matches.push({
          id: `${ts}-${round}-${matches.length}`,
          team1Id: t1.id,
          team2Id: t2.id,
          team1Score: null,
          team2Score: null,
          status: 'pending',
        });
      }
    }

    // Rotate: move last element to front
    rotating.unshift(rotating.pop());
  }

  return matches;
}

/**
 * Generate knockout matches from standings.
 * @param {Array} standings - Sorted standings array (index 0 = 1st place)
 * @param {object} knockoutConfig - { teamsAdvancing: 2|4, thirdPlaceMatch: boolean }
 * @returns {Array} Knockout match objects with round/label fields
 */
export function generateKnockoutMatches(standings, knockoutConfig) {
  const { teamsAdvancing, thirdPlaceMatch } = knockoutConfig;
  const ts = Date.now();
  const matches = [];

  if (teamsAdvancing === 2) {
    matches.push({
      id: `${ts}-final`,
      round: 'final',
      label: 'Final',
      team1Id: standings[0]?.teamId || null,
      team2Id: standings[1]?.teamId || null,
      status: 'pending',
      winner: null,
    });
  } else if (teamsAdvancing === 4) {
    // Semi-finals: 1st vs 4th, 2nd vs 3rd
    matches.push({
      id: `${ts}-semi-1`,
      round: 'semi-1',
      label: 'Semi-final 1',
      team1Id: standings[0]?.teamId || null,
      team2Id: standings[3]?.teamId || null,
      status: 'pending',
      winner: null,
    });
    matches.push({
      id: `${ts}-semi-2`,
      round: 'semi-2',
      label: 'Semi-final 2',
      team1Id: standings[1]?.teamId || null,
      team2Id: standings[2]?.teamId || null,
      status: 'pending',
      winner: null,
    });

    // Final (teams TBD until semis complete)
    matches.push({
      id: `${ts}-final`,
      round: 'final',
      label: 'Final',
      team1Id: null,
      team2Id: null,
      status: 'pending',
      winner: null,
    });

    // Optional 3rd place match
    if (thirdPlaceMatch) {
      matches.push({
        id: `${ts}-third`,
        round: 'third-place',
        label: '3rd Place',
        team1Id: null,
        team2Id: null,
        status: 'pending',
        winner: null,
      });
    }
  }

  return matches;
}

export function getTotalMatchCount(teamCount) {
  return (teamCount * (teamCount - 1)) / 2;
}

export function getCompletedMatchCount(matches) {
  return matches.filter(m => m.status === 'completed').length;
}
