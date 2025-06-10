import React, { useState, useEffect } from "react";
import { get, post } from "@/utils/request";
import { useTeamConfig } from "../contexts/TeamConfigContext";

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
  scorecard: {
    matchId: number;
    opponent: string;
    matchResult: string;
    teamScore: string;
    opponentScore: string;
    teamBatting: BattingRecord[];
    teamBowling: BowlingRecord[];
  };
}

interface AggregatedBattingStats {
  playerId: number;
  playerName: string;
  matches: number;
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

const TeamStatsTab: React.FC = () => {
  const [teamStats, setTeamStats] = useState<TeamStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'matches' | 'batting' | 'bowling'>('matches');
  const { teamConfig } = useTeamConfig();
  
  // Get profile ID from localStorage
  const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        // This will fetch from TEAM_STATS blob when implemented
        const data = await get<TeamStatsData>("/api/get-team-stats");
        setTeamStats(data);
      } catch (err) {
        setError("Failed to load team statistics");
        console.error("Error fetching team stats:", err);
        // Set empty data for now
        setTeamStats({
          matches: [],
          battingStats: [],
          bowlingStats: [],
          aggregatedBattingStats: [],
          aggregatedBowlingStats: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

  const handleReshuffle = async () => {
    if (window.confirm("Are you sure you want to clear all team statistics? This action cannot be undone.")) {
      try {
        await post("/api/clear-team-stats", {});
        alert("Team statistics cleared successfully!");
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "Failed to clear team statistics");
      }
    }
  };

  // Check if user can see reshuffle button (same logic as award button)
  const canReshuffle = teamConfig && profileId && (
    profileId === String(teamConfig.ADMIN_PROFILE_ID) || 
    teamConfig.AWARD_NOW_VISIBLITY_PROFILE_ID.includes(Number(profileId))
  );

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading team statistics...</div>
      </div>
    );
  }

  if (error || !teamStats) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error || "Failed to load team statistics"}</div>
      </div>
    );
  }

  const renderMatches = () => (
    <div className="space-y-4">
      {teamStats?.matches?.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No match statistics available</div>
      ) : (
        teamStats?.matches?.map((match, index) => {
          const isCounterStrikersWin = match.winningTeam === 'CounterStrikers';
          const opponent = match.scorecard.opponent;
          const matchDate = new Date(match.startDateTime).toLocaleDateString();
          
          return (
            <div key={match.matchId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">vs {opponent}</h3>
                  <p className="text-sm text-gray-600">{matchDate}</p>
                  <p className="text-xs text-gray-500">{match.venue}, {match.city}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isCounterStrikersWin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isCounterStrikersWin ? 'Won' : 'Lost'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{match.matchType}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">CounterStrikers: <span className="font-medium">{match.scorecard.teamScore}</span></p>
                </div>
                <div>
                  <p className="text-gray-600">{opponent}: <span className="font-medium">{match.scorecard.opponentScore}</span></p>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">{match.matchResult}</p>
                {match.tossDetails && (
                  <p className="text-xs text-gray-500">{match.tossDetails}</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderBattingStats = () => {
    if (!teamStats?.aggregatedBattingStats?.length) {
      return (
        <div className="text-center text-gray-500 py-8">No batting statistics available</div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Runs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">4s/6s</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strike Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Highest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamStats.aggregatedBattingStats.map((player) => (
              <tr key={player.playerId}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.playerName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.totalRuns}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.totalFours}/{player.totalSixes}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.strikeRate.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.average.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.highestScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBowlingStats = () => {
    if (!teamStats?.aggregatedBowlingStats?.length) {
      return (
        <div className="text-center text-gray-500 py-8">No bowling statistics available</div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wickets</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Runs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Economy</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamStats.aggregatedBowlingStats.map((player) => (
              <tr key={player.playerId}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.playerName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{Math.floor(player.totalBalls / 6)}.{player.totalBalls % 6}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.totalWickets}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.totalRuns}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.economyRate.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{player.bowlingAverage > 0 ? player.bowlingAverage.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Reshuffle Button */}
      {canReshuffle && (
        <div className="flex justify-end">
          <button
            onClick={handleReshuffle}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded transition-colors flex items-center gap-2 shadow-sm"
            title="Clear all team statistics"
          >
            <span>🔄</span>
            Reshuffle
          </button>
        </div>
      )}

      {/* Section Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'matches', label: 'Matches', icon: '⚽' },
            { key: 'batting', label: 'Batting Stats', icon: '🏏' },
            { key: 'bowling', label: 'Bowling Stats', icon: '⚡' }
          ].map((section) => {
            const getLabel = () => {
              if (section.key === 'matches' && teamStats?.matches?.length) {
                return `${section.label} (${teamStats.matches.length})`;
              }
              return section.label;
            };

            return (
              <button
                key={section.key}
                className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  activeSection === section.key
                    ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveSection(section.key as any)}
              >
                <span>{section.icon}</span>
                {getLabel()}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeSection === 'matches' && renderMatches()}
          {activeSection === 'batting' && renderBattingStats()}
          {activeSection === 'bowling' && renderBowlingStats()}
        </div>
      </div>
    </div>
  );
};

export default TeamStatsTab; 