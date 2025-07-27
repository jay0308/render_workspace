import React, { useState, useEffect } from "react";
import { post } from "@/utils/request";
import { useTeamConfig } from "../contexts/TeamConfigContext";
import { useTeamStats, AggregatedBattingStats, AggregatedBowlingStats, TeamStatsData } from "../contexts/TeamStatsContext";
import BattingOrderModal from "./BattingOrderModal";
import PlayerAnalysisModal from "./PlayerAnalysisModal";
import { aggregatePlayerStats } from "../utils/playerAnalysisUtils";

const TeamStatsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'matches' | 'batting' | 'bowling'>('matches');
  const [battingSortBy, setBattingSortBy] = useState<keyof AggregatedBattingStats>('totalRuns');
  const [battingSortOrder, setBattingSortOrder] = useState<'asc' | 'desc'>('desc');
  const [bowlingSortBy, setBowlingSortBy] = useState<keyof AggregatedBowlingStats>('totalWickets');
  const [bowlingSortOrder, setBowlingSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showBattingOrderModal, setShowBattingOrderModal] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  
  // Player Analysis Modal state
  const [showPlayerAnalysisModal, setShowPlayerAnalysisModal] = useState(false);
  const [selectedPlayerForAnalysis, setSelectedPlayerForAnalysis] = useState<any>(null);
  
  const { teamConfig } = useTeamConfig();
  const { teamStats, isLoading: loading, error, fetchTeamStats, refreshTeamStats } = useTeamStats();
  
  // Get profile ID from localStorage
  const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;

  useEffect(() => {
    fetchTeamStats();
  }, [fetchTeamStats]);

  const handleReshuffle = () => {
    setShowBattingOrderModal(true);
  };

  const handleClearStats = async () => {
    try {
      // Clear team stats data
      await post("/api/clear-team-stats", {});
      console.log("Team statistics cleared");
      
      // Refresh team stats from context
      await refreshTeamStats();
      
      // Show success alert
      alert("Team statistics cleared successfully!");
      
      // Reload the page to refresh the team config
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear team stats:", err);
      alert("Failed to clear team statistics");
    }
  };

  const handleBattingOrderUpdated = async () => {
    // Use the unified method
    // await handleClearStats();
    window.location.reload();
  };

  // Handle player analysis
  const handlePlayerAnalysis = (playerId: number, playerName: string) => {
    // Convert team stats to the format expected by PlayerAnalysisModal
    const battingPlayer = teamStats?.aggregatedBattingStats?.find((p: any) => p.playerId === playerId);
    const bowlingPlayer = teamStats?.aggregatedBowlingStats?.find((p: any) => p.playerId === playerId);
    
    if (battingPlayer || bowlingPlayer) {
      const playerStats = {
        playerId: String(playerId),
        playerName,
        profileImage: (battingPlayer as any)?.profileImage || (bowlingPlayer as any)?.profileImage,
        batting: {
          innings: battingPlayer?.innings || 0,
          runs: battingPlayer?.totalRuns || 0,
          strikeRate: battingPlayer?.strikeRate || 0,
          average: battingPlayer?.average || 0
        },
        bowling: {
          innings: bowlingPlayer?.innings || 0,
          wickets: bowlingPlayer?.totalWickets || 0,
          economy: bowlingPlayer?.economyRate || 0,
          average: bowlingPlayer?.bowlingAverage || 0
        }
      };
      
      setSelectedPlayerForAnalysis(playerStats);
      setShowPlayerAnalysisModal(true);
    }
  };

  // Check if user can see reshuffle button (same logic as award button)
  const canReshuffle = teamConfig && profileId && (
    profileId === String(teamConfig.ADMIN_PROFILE_ID) || 
    teamConfig.AWARD_NOW_VISIBLITY_PROFILE_ID.includes(Number(profileId))
  );

  // Sorting functions
  const handleBattingSort = (column: keyof AggregatedBattingStats) => {
    if (battingSortBy === column) {
      setBattingSortOrder(battingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBattingSortBy(column);
      setBattingSortOrder('desc');
    }
  };

  const handleBowlingSort = (column: keyof AggregatedBowlingStats) => {
    if (bowlingSortBy === column) {
      setBowlingSortOrder(bowlingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setBowlingSortBy(column);
      setBowlingSortOrder('desc');
    }
  };

  const getSortedBattingStats = () => {
    if (!teamStats?.aggregatedBattingStats) return [];
    
    return [...teamStats.aggregatedBattingStats].sort((a, b) => {
      const aValue = a[battingSortBy];
      const bValue = b[battingSortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return battingSortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      return battingSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    });
  };

  const getSortedBowlingStats = () => {
    if (!teamStats?.aggregatedBowlingStats) return [];
    
    return [...teamStats.aggregatedBowlingStats].sort((a, b) => {
      const aValue = a[bowlingSortBy];
      const bValue = b[bowlingSortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return bowlingSortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      return bowlingSortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    });
  };

  const SortableHeader: React.FC<{
    children: React.ReactNode;
    sortKey: string;
    currentSort: string;
    sortOrder: 'asc' | 'desc';
    onClick: () => void;
  }> = ({ children, sortKey, currentSort, sortOrder, onClick }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none"
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {children}
        {currentSort === sortKey && (
          <span className="text-gray-400">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
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
        teamStats?.matches
          ?.sort((a: any, b: any) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
          ?.map((match: any, index: number) => {
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

              {(match.tinyShareUrl || match.scorecard.tinyShareUrl) && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <button
                    className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm shadow transition-colors"
                    onClick={() => window.open(match.tinyShareUrl || match.scorecard.tinyShareUrl, '_blank')}
                  >
                    📊 View Full Scorecard
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  // Check if player is an all-rounder (appears in both batting and bowling stats)
  const isAllRounder = (playerId: number) => {
    const hasBatting = teamStats?.aggregatedBattingStats?.some((p: any) => p.playerId === playerId);
    const hasBowling = teamStats?.aggregatedBowlingStats?.some((p: any) => p.playerId === playerId);
    return hasBatting && hasBowling;
  };

  // Get batting performance score (0-9)
  const getBattingScore = (player: AggregatedBattingStats) => {
    if (!teamConfig) return 0;
    
    const { average, strikeRate, totalRuns } = player;
    const configAverage = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20;
    const configStrikeRate = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100;
    
    const avgThreshold = { excellent: configAverage * 1.5, average: configAverage };
    const srThreshold = { excellent: configStrikeRate * 1.3, average: configStrikeRate };
    const runsThreshold = { excellent: Math.max(100, player.innings * 25), average: Math.max(50, player.innings * 15) };
    
    let score = 0;
    
    // Score based on average
    if (average >= avgThreshold.excellent) score += 3;
    else if (average >= avgThreshold.average) score += 2;
    else score += 1;
    
    // Score based on strike rate
    if (strikeRate >= srThreshold.excellent) score += 3;
    else if (strikeRate >= srThreshold.average) score += 2;
    else score += 1;
    
    // Score based on total runs
    if (totalRuns >= runsThreshold.excellent) score += 3;
    else if (totalRuns >= runsThreshold.average) score += 2;
    else score += 1;
    
    return score;
  };

  // Get bowling performance score (0-9)
  const getBowlingScore = (player: AggregatedBowlingStats) => {
    if (!teamConfig) return 0;
    
    const { economyRate, bowlingAverage, totalWickets } = player;
    const configMaxEconomy = teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumEconomy || 10.5;
    const configMaxAverage = (teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime as any)?.maximumAverage || 30;
    const configUnderperformingEconomy = teamConfig.additionalInfo?.evaluationCriteria?.bowling?.underperforming?.economyThreshold || 12.5;
    
    const economyThreshold = { 
      excellent: configMaxEconomy * 0.7,
      average: configMaxEconomy,
      underperforming: configUnderperformingEconomy
    };
    const avgThreshold = { 
      excellent: configMaxAverage * 0.67, // 20 if max is 30
      average: configMaxAverage // Use config value (30)
    };
    const wicketsThreshold = { 
      excellent: Math.max(6, player.innings * 1.5),
      average: Math.max(3, player.innings * 0.8)
    };
    
    let score = 0;
    
    // Score based on economy rate
    if (economyRate <= economyThreshold.excellent) score += 3;
    else if (economyRate <= economyThreshold.average) score += 2;
    else if (economyRate <= economyThreshold.underperforming) score += 1;
    else score += 0;
    
    // Score based on bowling average
    if (bowlingAverage > 0) {
      if (bowlingAverage <= avgThreshold.excellent) score += 3;
      else if (bowlingAverage <= avgThreshold.average) score += 2;
      else score += 1;
    } else {
      score += 1;
    }
    
    // Score based on total wickets
    if (totalWickets >= wicketsThreshold.excellent) score += 3;
    else if (totalWickets >= wicketsThreshold.average) score += 2;
    else score += 1;
    
    return score;
  };

  // Performance categorization logic for batting based on team config
  const categorizeBattingPerformance = (player: AggregatedBattingStats) => {
    if (!teamConfig) return { category: 'unknown', color: 'bg-gray-100' };
    
    // Check if player is an all-rounder
    if (isAllRounder(player.playerId)) {
      const battingScore = getBattingScore(player);
      const bowlingPlayer = teamStats?.aggregatedBowlingStats?.find((p: any) => p.playerId === player.playerId);
      const bowlingScore = bowlingPlayer ? getBowlingScore(bowlingPlayer) : 0;
      
      // Combined score for all-rounders (weighted average)
      const combinedScore = (battingScore + bowlingScore) / 2;
      
      // More lenient thresholds for all-rounders
      if (combinedScore >= 6.5) return { category: 'excellent', color: 'bg-green-100' };
      if (combinedScore >= 4.5) return { category: 'average', color: 'bg-orange-100' };
      return { category: 'underperformer', color: 'bg-red-100' };
    }
    
    // Regular batting-only evaluation
    const battingScore = getBattingScore(player);
    
    if (battingScore >= 8) return { category: 'excellent', color: 'bg-green-100' };
    if (battingScore >= 6) return { category: 'average', color: 'bg-orange-100' };
    return { category: 'underperformer', color: 'bg-red-100' };
  };

  const renderPerformanceLegend = () => {
    if (!teamConfig) return null;
    
    const configAverage = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20;
    const configStrikeRate = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100;
    const configMaxEconomy = teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumEconomy || 10.5;
    const configMaxBowlingAverage = (teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime as any)?.maximumAverage || 30;
    const configUnderperformingEconomy = teamConfig.additionalInfo?.evaluationCriteria?.bowling?.underperforming?.economyThreshold || 12.5;

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <button
          onClick={() => setIsLegendExpanded(!isLegendExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span>Performance Categories & Benchmarks</span>
          <span className="text-gray-400">
            {isLegendExpanded ? '▼' : '▶'}
          </span>
        </button>
        
        {isLegendExpanded && (
          <>
            <div className="mt-3 mb-2">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 rounded"></div>
                  <span className="text-gray-500">Excellent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-100 rounded"></div>
                  <span className="text-gray-500">Average</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 rounded"></div>
                  <span className="text-gray-500">Underperformer</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div>
                <strong>Batting Benchmarks:</strong>
                <div>• Minimum Average: {configAverage}+ runs</div>
                <div>• Minimum Strike Rate: {configStrikeRate}+</div>
              </div>
              <div>
                <strong>Bowling Benchmarks:</strong>
                <div>• Target Economy: ≤{configMaxEconomy}</div>
                <div>• Target Average: &lt;{configMaxBowlingAverage}</div>
                <div>• Underperforming: &gt;{configUnderperformingEconomy}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <strong>📝 All-Rounder Evaluation:</strong> Players who both bat and bowl are evaluated using combined performance scores with more lenient thresholds, recognizing their dual contributions to the team.
            </div>
          </>
        )}
      </div>
    );
  };

  const renderBattingStats = () => {
    if (!teamStats?.aggregatedBattingStats?.length) {
      return (
        <div className="text-center text-gray-500 py-8">No batting statistics available</div>
      );
    }

    return (
      <div className="space-y-4">
        {renderPerformanceLegend()}
        <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                sortKey="playerName"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('playerName')}
              >
                Player
              </SortableHeader>
              <SortableHeader
                sortKey="totalRuns"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('totalRuns')}
              >
                Runs
              </SortableHeader>
              <SortableHeader
                sortKey="strikeRate"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('strikeRate')}
              >
                Strike Rate
              </SortableHeader>
              <SortableHeader
                sortKey="average"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('average')}
              >
                Average
              </SortableHeader>
              <SortableHeader
                sortKey="totalFours"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('totalFours')}
              >
                4s/6s
              </SortableHeader>
              <SortableHeader
                sortKey="highestScore"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('highestScore')}
              >
                Highest
              </SortableHeader>
              <SortableHeader
                sortKey="innings"
                currentSort={battingSortBy}
                sortOrder={battingSortOrder}
                onClick={() => handleBattingSort('innings')}
              >
                Innings
              </SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getSortedBattingStats().map((player) => {
              const performance = categorizeBattingPerformance(player);
              return (
                <tr key={player.playerId} className={performance.color}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.playerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.totalRuns}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.strikeRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.average.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.totalFours}/{player.totalSixes}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.highestScore}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="text-xs text-gray-400">
                      {player.innings - player.notOutInnings}*/{player.notOutInnings}
                    </div>
                    <div className="font-medium">{player.innings}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handlePlayerAnalysis(player.playerId, player.playerName)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Analyse
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  // Performance categorization logic for bowling based on team config
  const categorizeBowlingPerformance = (player: AggregatedBowlingStats) => {
    if (!teamConfig) return { category: 'unknown', color: 'bg-gray-100' };
    
    // Check if player is an all-rounder
    if (isAllRounder(player.playerId)) {
      const bowlingScore = getBowlingScore(player);
      const battingPlayer = teamStats?.aggregatedBattingStats?.find((p: any) => p.playerId === player.playerId);
      const battingScore = battingPlayer ? getBattingScore(battingPlayer) : 0;
      
      // Combined score for all-rounders (weighted average)
      const combinedScore = (battingScore + bowlingScore) / 2;
      
      // More lenient thresholds for all-rounders
      if (combinedScore >= 6.5) return { category: 'excellent', color: 'bg-green-100' };
      if (combinedScore >= 4.5) return { category: 'average', color: 'bg-orange-100' };
      return { category: 'underperformer', color: 'bg-red-100' };
    }
    
    // Regular bowling-only evaluation
    const bowlingScore = getBowlingScore(player);
    
    if (bowlingScore >= 8) return { category: 'excellent', color: 'bg-green-100' };
    if (bowlingScore >= 6) return { category: 'average', color: 'bg-orange-100' };
    return { category: 'underperformer', color: 'bg-red-100' };
  };

  const renderBowlingStats = () => {
    if (!teamStats?.aggregatedBowlingStats?.length) {
      return (
        <div className="text-center text-gray-500 py-8">No bowling statistics available</div>
      );
    }

    return (
      <div className="space-y-4">
        {renderPerformanceLegend()}
        <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                sortKey="playerName"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('playerName')}
              >
                Player
              </SortableHeader>
              <SortableHeader
                sortKey="totalBalls"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('totalBalls')}
              >
                Overs
              </SortableHeader>
              <SortableHeader
                sortKey="totalWickets"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('totalWickets')}
              >
                Wickets
              </SortableHeader>
              <SortableHeader
                sortKey="economyRate"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('economyRate')}
              >
                Economy
              </SortableHeader>
              <SortableHeader
                sortKey="bowlingAverage"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('bowlingAverage')}
              >
                Average
              </SortableHeader>
              <SortableHeader
                sortKey="totalRuns"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('totalRuns')}
              >
                Runs
              </SortableHeader>
              <SortableHeader
                sortKey="innings"
                currentSort={bowlingSortBy}
                sortOrder={bowlingSortOrder}
                onClick={() => handleBowlingSort('innings')}
              >
                Innings
              </SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getSortedBowlingStats().map((player) => {
              const performance = categorizeBowlingPerformance(player);
              return (
                <tr key={player.playerId} className={performance.color}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.playerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{Math.floor(player.totalBalls / 6)}.{player.totalBalls % 6}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.totalWickets}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.economyRate.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.bowlingAverage > 0 ? player.bowlingAverage.toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.totalRuns}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{player.innings}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handlePlayerAnalysis(player.playerId, player.playerName)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Analyse
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Reshuffle Button */}
      {canReshuffle && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleReshuffle}
            className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4 py-2 rounded transition-colors flex items-center gap-2 shadow-sm"
            title="Update batting order"
          >
            <span>🔄</span>
            Reshuffle Batting Order
          </button>
          <button
            onClick={handleClearStats}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded transition-colors flex items-center gap-2 shadow-sm"
            title="Clear all team statistics"
          >
            <span>🗑️</span>
            Clear Stats
          </button>
        </div>
      )}

      {/* Batting Order Modal */}
      {teamConfig && (
        <BattingOrderModal
          isOpen={showBattingOrderModal}
          onClose={() => setShowBattingOrderModal(false)}
          initialBattingOrder={
            (teamConfig.teamMembers || []).filter(orderPlayer => {
              const members: any[] = (teamConfig as any).teamMembers || [];
              return Array.isArray(members)
                ? members.some((m: any) => m.playerId === orderPlayer.playerId && m.isActive)
                : true;
            })
          }
          onOrderUpdated={handleBattingOrderUpdated}
        />
      )}

      {/* Player Analysis Modal */}
      {selectedPlayerForAnalysis && teamConfig && (
        <PlayerAnalysisModal
          isOpen={showPlayerAnalysisModal}
          onClose={() => {
            setShowPlayerAnalysisModal(false);
            setSelectedPlayerForAnalysis(null);
          }}
          player={selectedPlayerForAnalysis}
          teamConfig={teamConfig}
        />
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