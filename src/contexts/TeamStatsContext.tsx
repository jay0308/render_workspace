import React, { createContext, useContext, useState, ReactNode } from "react";
import { get } from "@/utils/request";

interface BattingRecord {
  playerId: number;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  howOut: string;
  minutes: number;
  matchId: number;
  matchDate: string;
  opponent: string;
}

interface BowlingRecord {
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
  matchId: number;
  matchDate: string;
  opponent: string;
}

interface MatchRecord {
  matchId: number;
  tournament: string;
  round: string;
  venue: string;
  city: string;
  matchType: string;
  overs: number;
  startDateTime: string;
  tossDetails: string;
  teamA: { id: number; name: string; score: string };
  teamB: { id: number; name: string; score: string };
  matchResult: string;
  winBy: string;
  winningTeam: string;
  playerOfTheMatch?: any;
  tinyShareUrl?: string;
  scorecard: {
    matchId: number;
    opponent: string;
    matchResult: string;
    teamScore: string;
    opponentScore: string;
    teamBatting: BattingRecord[];
    teamBowling: BowlingRecord[];
    tinyShareUrl?: string;
  };
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

interface TeamStatsData {
  matches: MatchRecord[];
  battingStats: BattingRecord[];
  bowlingStats: BowlingRecord[];
  aggregatedBattingStats: AggregatedBattingStats[];
  aggregatedBowlingStats: AggregatedBowlingStats[];
  metadata?: {
    lastUpdated: string;
    totalMatches: number;
  };
}

interface TeamStatsContextType {
  teamStats: TeamStatsData | null;
  setTeamStats: (stats: TeamStatsData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  fetchTeamStats: () => Promise<void>;
  refreshTeamStats: () => Promise<void>;
}

const TeamStatsContext = createContext<TeamStatsContextType | undefined>(undefined);

export const TeamStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamStats = async () => {
    // Only fetch if data doesn't exist
    if (teamStats) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await get<TeamStatsData>("/api/get-team-stats");
      setTeamStats(data);
    } catch (err) {
      setError("Failed to load team statistics");
      console.error("Error fetching team stats:", err);
      // Set empty data on error
      setTeamStats({
        matches: [],
        battingStats: [],
        bowlingStats: [],
        aggregatedBattingStats: [],
        aggregatedBowlingStats: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTeamStats = async () => {
    // Force refresh by clearing existing data first
    setTeamStats(null);
    try {
      setIsLoading(true);
      setError(null);
      const data = await get<TeamStatsData>("/api/get-team-stats");
      setTeamStats(data);
    } catch (err) {
      setError("Failed to load team statistics");
      console.error("Error fetching team stats:", err);
      setTeamStats({
        matches: [],
        battingStats: [],
        bowlingStats: [],
        aggregatedBattingStats: [],
        aggregatedBowlingStats: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TeamStatsContext.Provider
      value={{
        teamStats,
        setTeamStats,
        isLoading,
        setIsLoading,
        error,
        setError,
        fetchTeamStats,
        refreshTeamStats,
      }}
    >
      {children}
    </TeamStatsContext.Provider>
  );
};

export const useTeamStats = () => {
  const context = useContext(TeamStatsContext);
  if (context === undefined) {
    throw new Error("useTeamStats must be used within a TeamStatsProvider");
  }
  return context;
};

export type { TeamStatsData, AggregatedBattingStats, AggregatedBowlingStats }; 