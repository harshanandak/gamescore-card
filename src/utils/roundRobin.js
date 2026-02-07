// Round-robin tournament match generation

export function generateRoundRobinMatches(teams) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `${Date.now()}-${i}-${j}`,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        team1Score: null,
        team2Score: null,
        status: 'pending',
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
