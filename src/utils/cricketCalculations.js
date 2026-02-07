// Cricket scoring calculations

export function ballsToOvers(balls) {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  return remaining === 0 ? `${overs}` : `${overs}.${remaining}`;
}

export function oversToDecimal(balls) {
  const overs = Math.floor(balls / 6);
  const remaining = balls % 6;
  return overs + remaining / 6;
}

export function calculateRunRate(runs, balls) {
  if (balls === 0) return 0;
  return (runs * 6) / balls;
}

export function calculateNRR(runsScored, ballsFaced, runsConceded, ballsBowled) {
  if (ballsFaced === 0 || ballsBowled === 0) return 0;
  const runRate = (runsScored * 6) / ballsFaced;
  const runRateAgainst = (runsConceded * 6) / ballsBowled;
  return runRate - runRateAgainst;
}

export function getMatchWinner(match) {
  if (!match.team1Score || !match.team2Score) return null;
  const t1 = match.team1Score.runs;
  const t2 = match.team2Score.runs;
  if (t1 > t2) return match.team1Id;
  if (t2 > t1) return match.team2Id;
  return 'tie';
}

export function calculateCricketPointsTable(teams, matches) {
  const table = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    points: 0,
    runsScored: 0,
    ballsFaced: 0,
    runsConceded: 0,
    ballsBowled: 0,
    nrr: 0,
  }));

  matches.forEach(match => {
    if (match.status !== 'completed' || !match.team1Score || !match.team2Score) return;

    const t1 = table.find(t => t.teamId === match.team1Id);
    const t2 = table.find(t => t.teamId === match.team2Id);
    if (!t1 || !t2) return;

    const totalBalls = match.format?.overs ? match.format.overs * 6 : 12;

    t1.played++;
    t2.played++;

    t1.runsScored += match.team1Score.runs;
    t1.ballsFaced += match.team1Score.allOut ? totalBalls : match.team1Score.balls;
    t1.runsConceded += match.team2Score.runs;
    t1.ballsBowled += match.team2Score.allOut ? totalBalls : match.team2Score.balls;

    t2.runsScored += match.team2Score.runs;
    t2.ballsFaced += match.team2Score.allOut ? totalBalls : match.team2Score.balls;
    t2.runsConceded += match.team1Score.runs;
    t2.ballsBowled += match.team1Score.allOut ? totalBalls : match.team1Score.balls;

    const winner = getMatchWinner(match);
    if (winner === match.team1Id) {
      t1.won++;
      t1.points += 2;
      t2.lost++;
    } else if (winner === match.team2Id) {
      t2.won++;
      t2.points += 2;
      t1.lost++;
    } else {
      t1.tied++;
      t1.points += 1;
      t2.tied++;
      t2.points += 1;
    }
  });

  table.forEach(team => {
    team.nrr = calculateNRR(
      team.runsScored, team.ballsFaced,
      team.runsConceded, team.ballsBowled
    );
  });

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });
}

export const OVERS_PRESETS = [
  { label: '2 ov', value: 2 },
  { label: '5 ov', value: 5 },
  { label: '10 ov', value: 10 },
  { label: '20 ov', value: 20 },
];
