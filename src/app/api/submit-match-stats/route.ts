import { NextRequest, NextResponse } from "next/server";
import { getTeamStats, updateTeamStats, getConfigData } from "@/utils/JSONBlobUtils";

interface BattingStats {
  playerId: number;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  howOut: string;
  minutes: number;
}

interface AggregatedBattingStats {
  playerId: number;
  playerName: string;
  matches: number;
  innings: number;
  totalRuns: number;
  totalBalls: number;
  totalFours: number;
  totalSixes: number;
  highestScore: number;
  notOutInnings: number;
  average: number;
  strikeRate: number;
}

interface AggregatedBowlingStats {
  playerId: number;
  playerName: string;
  matches: number;
  innings: number;
  totalOvers: number;
  totalBalls: number;
  totalRuns: number;
  totalWickets: number;
  totalMaidens: number;
  economyRate: number;
  bowlingAverage: number;
  bestFigures: string;
}

interface BowlingStats {
  playerId: number;
  playerName: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economyRate: string;
  wides: number;
  noBalls: number;
  dotBalls: number;
}

interface MatchScorecardData {
  matchId: number;
  matchDate: string;
  venue: string;
  tournament: string;
  opponent: string;
  matchResult: string;
  teamBatting: BattingStats[];
  teamBowling: BowlingStats[];
  teamScore: string;
  opponentScore: string;
  matchType: string;
  overs: number;
  tinyShareUrl?: string;
}

async function extractScorecardData(matchJson: any): Promise<MatchScorecardData> {
  const summaryData = matchJson?.props?.pageProps?.summaryData?.data;
  const scorecard = matchJson?.props?.pageProps?.scorecard;
  
  if (!summaryData || !scorecard) {
    throw new Error("Invalid match data structure");
  }

  // Get CounterStrikers team ID from config
  const config = await getConfigData();
  
  // Find CounterStrikers team data using team ID
  const counterStrikersTeam = scorecard.find((team: any) => 
    team.team_id === config.COUNTERSTRIKERS_TEAM_ID
  );
  
  if (!counterStrikersTeam) {
    throw new Error("CounterStrikers team data not found");
  }

  // Extract batting stats for CounterStrikers
  const teamBatting: BattingStats[] = counterStrikersTeam.batting.map((player: any) => ({
    playerId: player.player_id,
    playerName: player.name,
    runs: player.runs,
    balls: player.balls,
    fours: player["4s"],
    sixes: player["6s"],
    strikeRate: player.SR,
    howOut: player.how_to_out_short_name,
    minutes: player.minutes
  }));

  // Get opponent team info
  const opponentTeam = scorecard.find((team: any) => 
    team.team_id !== config.COUNTERSTRIKERS_TEAM_ID
  );

  // Extract bowling stats for CounterStrikers from opponent's scorecard
  const teamBowling: BowlingStats[] = opponentTeam?.bowling?.map((player: any) => ({
    playerId: player.player_id,
    playerName: player.name,
    overs: `${player.overs}.${player.balls%6}`,
    maidens: player.maidens,
    runs: player.runs,
    wickets: player.wickets,
    economyRate: player.economy_rate,
    wides: player.wide,
    noBalls: player.noball,
    dotBalls: player["0s"]
  })) || [];

  return {
    matchId: summaryData.match_id,
    matchDate: summaryData.start_datetime,
    venue: `${summaryData.ground_name}, ${summaryData.city_name}`,
    tournament: summaryData.tournament_name,
    opponent: opponentTeam?.teamName || "Unknown",
    matchResult: summaryData.match_summary?.summary || summaryData.win_by,
    teamBatting,
    teamBowling,
    teamScore: counterStrikersTeam.inning.summary.score,
    opponentScore: opponentTeam?.inning?.summary?.score || "Unknown",
    matchType: summaryData.match_type,
    overs: summaryData.overs,
    tinyShareUrl: summaryData.tiny_share_url
  };
}

function extractMatchSummary(matchJson: any) {
  const summaryData = matchJson?.props?.pageProps?.summaryData?.data;
  
  if (!summaryData) {
    throw new Error("Invalid match data structure");
  }

  return {
    matchId: summaryData.match_id,
    tournament: summaryData.tournament_name,
    round: summaryData.tournament_round_name,
    venue: summaryData.ground_name,
    city: summaryData.city_name,
    matchType: summaryData.match_type,
    overs: summaryData.overs,
    startDateTime: summaryData.start_datetime,
    tossDetails: summaryData.toss_details,
    teamA: {
      id: summaryData.team_a.id,
      name: summaryData.team_a.name,
      score: summaryData.team_a.summary
    },
    teamB: {
      id: summaryData.team_b.id,
      name: summaryData.team_b.name,
      score: summaryData.team_b.summary
    },
    matchResult: summaryData.match_summary?.summary,
    winBy: summaryData.win_by,
    winningTeam: summaryData.winning_team,
    playerOfTheMatch: summaryData.player_of_the_match,
    bestPerformances: summaryData.best_performances,
    tinyShareUrl: summaryData.tiny_share_url,
    createdAt: new Date().toISOString()
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get current config to check admin ID
    const currentConfig = await getConfigData();
    
    // Check if user is admin
    const profileId = req.headers.get("x-profile-id");
    if (!profileId || profileId !== String(currentConfig.ADMIN_PROFILE_ID)) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const { matchStatsJSON } = await req.json();
    
    if (!matchStatsJSON) {
      return NextResponse.json({ error: "matchStatsJSON is required" }, { status: 400 });
    }

    // Parse the JSON if it's a string
    let parsedMatchData;
    try {
      parsedMatchData = typeof matchStatsJSON === 'string' 
        ? JSON.parse(matchStatsJSON) 
        : matchStatsJSON;
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    // Extract scorecard and summary data
    let scorecardData: MatchScorecardData;
    let matchSummary: any;
    
    try {
      scorecardData = await extractScorecardData(parsedMatchData);
      matchSummary = extractMatchSummary(parsedMatchData);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to extract match data" }, { status: 400 });
    }

    // Get existing team stats
    let teamStats;
    try {
      teamStats = await getTeamStats();
    } catch (e) {
      // Initialize empty stats if none exist
      teamStats = {
        matches: [],
        battingStats: [],
        bowlingStats: [],
        aggregatedBattingStats: [],
        aggregatedBowlingStats: [],
        metadata: {}
      };
    }

    // Check if match already exists
    const existingMatchIndex = teamStats.matches?.findIndex(
      (match: any) => match.matchId === scorecardData.matchId
    );

    if (existingMatchIndex >= 0) {
      return NextResponse.json({ error: "Match already exists in team stats" }, { status: 400 });
    }

    // Add match data to team stats
    if (!teamStats.matches) {
      teamStats.matches = [];
    }
    
    teamStats.matches.push({
      ...matchSummary,
      scorecard: {
        ...scorecardData,
        tinyShareUrl: scorecardData.tinyShareUrl
      }
    });

    // Update team batting stats (individual records)
    if (!teamStats.battingStats) {
      teamStats.battingStats = [];
    }
    
    scorecardData.teamBatting.forEach(battingRecord => {
      teamStats.battingStats.push({
        ...battingRecord,
        matchId: scorecardData.matchId,
        matchDate: scorecardData.matchDate,
        opponent: scorecardData.opponent
      });
    });

    // Create/update aggregated batting stats by rebuilding from all records
    const updatedAggregatedStats = new Map<number, AggregatedBattingStats>();

    // Process all batting records to rebuild aggregated stats from scratch
    teamStats.battingStats.forEach((record: any) => {
      const playerId = record.playerId;
      
      if (!updatedAggregatedStats.has(playerId)) {
        updatedAggregatedStats.set(playerId, {
          playerId,
          playerName: record.playerName,
          matches: 0,
          innings: 0,
          totalRuns: 0,
          totalBalls: 0,
          totalFours: 0,
          totalSixes: 0,
          highestScore: 0,
          notOutInnings: 0,
          average: 0,
          strikeRate: 0
        });
      }

      const playerStats = updatedAggregatedStats.get(playerId)!;
      playerStats.matches += 1;
      playerStats.innings += 1; // Track innings played
      playerStats.totalRuns += record.runs;
      playerStats.totalBalls += record.balls;
      playerStats.totalFours += record.fours;
      playerStats.totalSixes += record.sixes;
      playerStats.highestScore = Math.max(playerStats.highestScore, record.runs);
      
      if (record.howOut === 'not out') {
        playerStats.notOutInnings += 1;
      }
    });

    // Calculate final averages and strike rates
    updatedAggregatedStats.forEach((player) => {
      const dismissedInnings = player.matches - player.notOutInnings;
      player.average = dismissedInnings > 0 ? (player.totalRuns / dismissedInnings) : player.totalRuns;
      player.strikeRate = player.totalBalls > 0 ? ((player.totalRuns / player.totalBalls) * 100) : 0;
    });

    // Update aggregated stats in team stats
    teamStats.aggregatedBattingStats = Array.from(updatedAggregatedStats.values())
      .sort((a, b) => b.totalRuns - a.totalRuns);

    // Update team bowling stats (individual records)
    if (!teamStats.bowlingStats) {
      teamStats.bowlingStats = [];
    }
    
    scorecardData.teamBowling.forEach(bowlingRecord => {
      teamStats.bowlingStats.push({
        ...bowlingRecord,
        matchId: scorecardData.matchId,
        matchDate: scorecardData.matchDate,
        opponent: scorecardData.opponent
      });
    });

    // Create/update aggregated bowling stats by rebuilding from all records
    const updatedBowlingStats = new Map<number, AggregatedBowlingStats>();

    // Process all bowling records to rebuild aggregated stats from scratch
    teamStats.bowlingStats.forEach((record: any) => {
      const playerId = record.playerId;
      
      if (!updatedBowlingStats.has(playerId)) {
        updatedBowlingStats.set(playerId, {
          playerId,
          playerName: record.playerName,
          matches: 0,
          innings: 0,
          totalOvers: 0,
          totalBalls: 0,
          totalRuns: 0,
          totalWickets: 0,
          totalMaidens: 0,
          economyRate: 0,
          bowlingAverage: 0,
          bestFigures: "0/0"
        });
      }

      const playerStats = updatedBowlingStats.get(playerId)!;
      playerStats.matches += 1;
      playerStats.innings += 1; // Track innings bowled
      
      // Parse overs (format: "4.0" means 4 overs and 0 balls)
      const oversParts = record.overs.split('.');
      const overs = parseInt(oversParts[0]) || 0;
      const balls = parseInt(oversParts[1]) || 0;
      const totalBalls = (overs * 6) + balls;
      
      playerStats.totalOvers += overs;
      playerStats.totalBalls += totalBalls;
      playerStats.totalRuns += record.runs;
      playerStats.totalWickets += record.wickets;
      playerStats.totalMaidens += record.maidens;
      
      // Update best figures if this is better
      const currentFigures = `${record.wickets}/${record.runs}`;
      if (record.wickets > 0) {
        const [bestWickets] = playerStats.bestFigures.split('/').map(Number);
        if (record.wickets > bestWickets || 
            (record.wickets === bestWickets && record.runs < parseInt(playerStats.bestFigures.split('/')[1]))) {
          playerStats.bestFigures = currentFigures;
        }
      }
    });

    // Calculate final economy rates and bowling averages
    updatedBowlingStats.forEach((player) => {
      const totalOversDecimal = player.totalBalls / 6;
      player.economyRate = totalOversDecimal > 0 ? (player.totalRuns / totalOversDecimal) : 0;
      player.bowlingAverage = player.totalWickets > 0 ? (player.totalRuns / player.totalWickets) : 0;
    });

    // Update aggregated bowling stats in team stats
    teamStats.aggregatedBowlingStats = Array.from(updatedBowlingStats.values())
      .sort((a, b) => b.totalWickets - a.totalWickets);

    // Add metadata
    teamStats.metadata = {
      ...teamStats.metadata,
      lastUpdated: new Date().toISOString(),
      updatedBy: profileId,
      totalMatches: teamStats.matches.length
    };

    // Save updated team stats
    await updateTeamStats(teamStats);
    
    return NextResponse.json({ 
      success: true,
      message: "Match statistics added successfully",
      data: {
        matchId: scorecardData.matchId,
        opponent: scorecardData.opponent,
        matchResult: scorecardData.matchResult,
        battingRecords: scorecardData.teamBatting.length,
        bowlingRecords: scorecardData.teamBowling.length,
        aggregatedBattingPlayers: teamStats.aggregatedBattingStats.length,
        aggregatedBowlingPlayers: teamStats.aggregatedBowlingStats.length,
        totalMatches: teamStats.matches.length
      }
    });

  } catch (error) {
    console.error("Error submitting match stats:", error);
    return NextResponse.json({ 
      error: "Failed to submit match statistics",
      details: (error as Error).message 
    }, { status: 500 });
  }
} 