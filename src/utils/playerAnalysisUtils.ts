// Utility functions for player analysis

export interface PlayerStats {
  playerId: string;
  playerName: string;
  profileImage?: string;
  batting: {
    innings: number;
    runs: number;
    strikeRate: number;
    average: number;
  };
  bowling: {
    innings: number;
    wickets: number;
    economy: number;
    average: number;
  };
}

export interface MatchStats {
  playerId: string;
  playerName: string;
  profileImage?: string;
  battingStats?: {
    runs: number;
    balls: number;
    fours?: number;
    sixes?: number;
  };
  bowlingStats?: {
    overs: number;
    runs: number;
    wickets: number;
    maidens?: number;
  };
}

// Convert match stats to aggregated player stats
export const aggregatePlayerStats = (matches: any[], playerId: string): PlayerStats | null => {
  const playerMatches = matches.filter(match => 
    match.battingStats?.some((p: any) => p.playerId === playerId) ||
    match.bowlingStats?.some((p: any) => p.playerId === playerId)
  );

  if (playerMatches.length === 0) return null;

  // Aggregate batting stats
  let totalRuns = 0;
  let totalBalls = 0;
  let totalInnings = 0;
  let dismissals = 0;

  // Aggregate bowling stats
  let totalWickets = 0;
  let totalOvers = 0;
  let totalRunsConceded = 0;
  let bowlingInnings = 0;

  playerMatches.forEach(match => {
    // Batting stats
    const battingStat = match.battingStats?.find((p: any) => p.playerId === playerId);
    if (battingStat) {
      totalRuns += battingStat.runs || 0;
      totalBalls += battingStat.balls || 0;
      totalInnings++;
      if (battingStat.runs !== undefined && battingStat.runs >= 0) {
        dismissals++; // Count as dismissal if runs recorded
      }
    }

    // Bowling stats
    const bowlingStat = match.bowlingStats?.find((p: any) => p.playerId === playerId);
    if (bowlingStat) {
      totalWickets += bowlingStat.wickets || 0;
      totalOvers += bowlingStat.overs || 0;
      totalRunsConceded += bowlingStat.runs || 0;
      bowlingInnings++;
    }
  });

  // Calculate averages and rates
  const battingAverage = dismissals > 0 ? totalRuns / dismissals : totalRuns;
  const strikeRate = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
  const bowlingAverage = totalWickets > 0 ? totalRunsConceded / totalWickets : 0;
  const economyRate = totalOvers > 0 ? totalRunsConceded / totalOvers : 0;

  // Get player info from first match
  const firstMatch = playerMatches[0];
  const playerInfo = firstMatch.battingStats?.find((p: any) => p.playerId === playerId) ||
                    firstMatch.bowlingStats?.find((p: any) => p.playerId === playerId);

  return {
    playerId,
    playerName: playerInfo?.playerName || 'Unknown Player',
    profileImage: playerInfo?.profileImage,
    batting: {
      innings: totalInnings,
      runs: totalRuns,
      strikeRate,
      average: battingAverage
    },
    bowling: {
      innings: bowlingInnings,
      wickets: totalWickets,
      economy: economyRate,
      average: bowlingAverage
    }
  };
};

// Get all players with aggregated stats
export const getAllPlayersStats = (matches: any[]): PlayerStats[] => {
  const playerIds = new Set<string>();
  
  // Collect all unique player IDs
  matches.forEach(match => {
    match.battingStats?.forEach((p: any) => playerIds.add(p.playerId));
    match.bowlingStats?.forEach((p: any) => playerIds.add(p.playerId));
  });

  // Aggregate stats for each player
  const playersStats: PlayerStats[] = [];
  playerIds.forEach(playerId => {
    const stats = aggregatePlayerStats(matches, playerId);
    if (stats) {
      playersStats.push(stats);
    }
  });

  return playersStats.sort((a, b) => {
    // Sort by total performance score (batting + bowling)
    const aScore = (a.batting.runs + a.bowling.wickets * 10);
    const bScore = (b.batting.runs + b.bowling.wickets * 10);
    return bScore - aScore;
  });
};

// Calculate performance score for a player
export const calculatePerformanceScore = (player: PlayerStats, teamConfig: any) => {
  const configAverage = teamConfig?.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20;
  const configStrikeRate = teamConfig?.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100;
  const configMaxEconomy = teamConfig?.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumEconomy || 9;
  const configMaxAverage = teamConfig?.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumAverage || 22;

  // Batting score calculation
  const avgThreshold = { excellent: configAverage * 1.5, average: configAverage };
  const srThreshold = { excellent: configStrikeRate * 1.3, average: configStrikeRate };
  const runsThreshold = { excellent: Math.max(100, player.batting.innings * 25), average: Math.max(50, player.batting.innings * 15) };
  
  let battingScore = 0;
  if (player.batting.average >= avgThreshold.excellent) battingScore += 3;
  else if (player.batting.average >= avgThreshold.average) battingScore += 2;
  else battingScore += 1;
  
  if (player.batting.strikeRate >= srThreshold.excellent) battingScore += 3;
  else if (player.batting.strikeRate >= srThreshold.average) battingScore += 2;
  else battingScore += 1;
  
  if (player.batting.runs >= runsThreshold.excellent) battingScore += 3;
  else if (player.batting.runs >= runsThreshold.average) battingScore += 2;
  else battingScore += 1;

  // Bowling score calculation
  const economyThreshold = { excellent: configMaxEconomy * 0.7, average: configMaxEconomy };
  const avgThresholdBowling = { excellent: configMaxAverage * 0.67, average: configMaxAverage };
  const wicketsThreshold = { excellent: Math.max(6, player.bowling.innings * 1.5), average: Math.max(3, player.bowling.innings * 0.8) };
  
  let bowlingScore = 0;
  if (player.bowling.economy <= economyThreshold.excellent) bowlingScore += 3;
  else if (player.bowling.economy <= economyThreshold.average) bowlingScore += 2;
  else bowlingScore += 1;
  
  if (player.bowling.average > 0) {
    if (player.bowling.average <= avgThresholdBowling.excellent) bowlingScore += 3;
    else if (player.bowling.average <= avgThresholdBowling.average) bowlingScore += 2;
    else bowlingScore += 1;
  } else {
    bowlingScore += 1;
  }
  
  if (player.bowling.wickets >= wicketsThreshold.excellent) bowlingScore += 3;
  else if (player.bowling.wickets >= wicketsThreshold.average) bowlingScore += 2;
  else bowlingScore += 1;

  return {
    battingScore,
    bowlingScore,
    totalScore: battingScore + bowlingScore,
    percentage: Math.round(((battingScore + bowlingScore) / 18) * 100)
  };
}; 