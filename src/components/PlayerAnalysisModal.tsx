import React from 'react';

interface PlayerStats {
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

interface TeamConfig {
  additionalInfo?: {
    evaluationCriteria?: {
      batting?: {
        topOrder?: {
          minimumAverage?: number;
          minimumStrikeRate?: number;
        };
      };
      bowling?: {
        fullTime?: {
          maximumEconomy?: number;
          maximumAverage?: number;
        };
        underperforming?: {
          economyThreshold?: number;
        };
      };
    };
  };
}

interface PlayerAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  teamConfig: TeamConfig;
}

const PlayerAnalysisModal: React.FC<PlayerAnalysisModalProps> = ({
  isOpen,
  onClose,
  player,
  teamConfig
}) => {
  if (!isOpen) return null;

  // Get config values with defaults
  const configAverage = teamConfig?.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20;
  const configStrikeRate = teamConfig?.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100;
  const configMaxEconomy = teamConfig?.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumEconomy || 9;
  const configMaxAverage = teamConfig?.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumAverage || 22;
  const configUnderperformingEconomy = teamConfig?.additionalInfo?.evaluationCriteria?.bowling?.underperforming?.economyThreshold || 12.5;

  // Calculate batting score (0-9)
  const getBattingScore = () => {
    const { average, strikeRate, runs, innings } = player.batting;
    
    // If player has no batting innings, return 0
    if (innings === 0) return 0;
    
    const avgThreshold = { excellent: configAverage * 1.5, average: configAverage };
    const srThreshold = { excellent: configStrikeRate * 1.3, average: configStrikeRate };
    const runsThreshold = { excellent: Math.max(100, innings * 25), average: Math.max(50, innings * 15) };
    
    let score = 0;
    
    // Score based on average
    if (average >= avgThreshold.excellent) score += 3;
    else if (average >= avgThreshold.average) score += 2;
    else if (average > 0) score += 1; // Only give 1 point if average is above 0
    else score += 0; // 0 points for 0 average
    
    // Score based on strike rate
    if (strikeRate >= srThreshold.excellent) score += 3;
    else if (strikeRate >= srThreshold.average) score += 2;
    else if (strikeRate > 0) score += 1; // Only give 1 point if strike rate is above 0
    else score += 0; // 0 points for 0 strike rate
    
    // Score based on total runs
    if (runs >= runsThreshold.excellent) score += 3;
    else if (runs >= runsThreshold.average) score += 2;
    else if (runs > 0) score += 1; // Only give 1 point if runs are above 0
    else score += 0; // 0 points for 0 runs
    
    return score;
  };

  // Calculate bowling score (0-9)
  const getBowlingScore = () => {
    const { economy, average, wickets, innings } = player.bowling;
    
    // If player has no bowling innings, return 0
    if (innings === 0) return 0;
    
    const economyThreshold = { 
      excellent: configMaxEconomy * 0.7,
      average: configMaxEconomy,
      underperforming: configUnderperformingEconomy
    };
    const avgThreshold = { 
      excellent: configMaxAverage * 0.67,
      average: configMaxAverage
    };
    const wicketsThreshold = { 
      excellent: Math.max(6, innings * 1.5),
      average: Math.max(3, innings * 0.8)
    };
    
    let score = 0;
    
    // Score based on economy rate
    if (economy <= economyThreshold.excellent) score += 3;
    else if (economy <= economyThreshold.average) score += 2;
    else if (economy <= economyThreshold.underperforming) score += 1;
    else score += 0;
    
    // Score based on bowling average
    if (average > 0) {
      if (average <= avgThreshold.excellent) score += 3;
      else if (average <= avgThreshold.average) score += 2;
      else score += 1;
    } else {
      score += 1;
    }
    
    // Score based on total wickets
    if (wickets >= wicketsThreshold.excellent) score += 3;
    else if (wickets >= wicketsThreshold.average) score += 2;
    else score += 1;
    
    return score;
  };

  const battingScore = getBattingScore();
  const bowlingScore = getBowlingScore();
  const totalScore = battingScore + bowlingScore;
  
  // Calculate max possible score based on player's participation
  const hasBatting = player.batting.innings > 0;
  const hasBowling = player.bowling.innings > 0;
  const maxPossibleScore = (hasBatting ? 9 : 0) + (hasBowling ? 9 : 0);
  
  // Calculate percentage based on actual participation
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Get performance category (same logic as TeamStatsTab)
  const getPerformanceCategory = (score: number) => {
    if (score >= 8) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 6) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-orange-100' };
    return { text: 'Underperformer', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Get role recommendation
  const getRoleRecommendation = () => {
    // Check if player only bats or only bowls
    const onlyBats = hasBatting && !hasBowling;
    const onlyBowls = hasBowling && !hasBatting;
    const isAllRounder = hasBatting && hasBowling;

    if (isAllRounder) {
      // All-rounder logic (both batting and bowling)
      if (battingScore >= 6 && bowlingScore >= 6) {
        return {
          role: 'All-Rounder',
          description: 'Balanced performer in both batting and bowling',
          battingPosition: '4-7',
          bowlingRole: 'Full quota bowler'
        };
      } else if (battingScore >= 6 && bowlingScore < 4) {
        return {
          role: 'Batting Specialist',
          description: 'Strong batting performance with limited bowling contribution',
          battingPosition: '1-7',
          bowlingRole: 'Part-time bowler'
        };
      } else if (bowlingScore >= 6 && battingScore < 4) {
        return {
          role: 'Bowling Specialist',
          description: 'Strong bowling performance with limited batting contribution',
          battingPosition: '8-11',
          bowlingRole: 'Full quota bowler'
        };
      } else if (battingScore >= 4 && bowlingScore >= 4) {
        return {
          role: 'Utility Player',
          description: 'Moderate contribution in both departments',
          battingPosition: '6-9',
          bowlingRole: 'Medium overs'
        };
      } else {
        return {
          role: 'Development Player',
          description: 'Needs improvement in both batting and bowling',
          battingPosition: '10-11',
          bowlingRole: 'Limited overs'
        };
      }
    } else if (onlyBats) {
      // Batting-only player logic
      if (battingScore >= 8) {
        return {
          role: 'Top Order Batsman',
          description: 'Strong batting performance, primary run scorer',
          battingPosition: '1-3',
          bowlingRole: 'Non-bowler'
        };
      } else if (battingScore >= 6) {
        return {
          role: 'Middle Order Batsman',
          description: 'Reliable batting performance',
          battingPosition: '4-7',
          bowlingRole: 'Non-bowler'
        };
      } else if (battingScore >= 4) {
        return {
          role: 'Lower Order Batsman',
          description: 'Limited batting contribution',
          battingPosition: '8-11',
          bowlingRole: 'Non-bowler'
        };
      } else {
        return {
          role: 'Tail-End Batsman',
          description: 'Minimal batting contribution, needs improvement',
          battingPosition: '10-11',
          bowlingRole: 'Non-bowler'
        };
      }
    } else if (onlyBowls) {
      // Bowling-only player logic
      if (bowlingScore >= 8) {
        return {
          role: 'Lead Bowler',
          description: 'Strong bowling performance, primary wicket taker',
          battingPosition: '10-11',
          bowlingRole: 'Full quota bowler'
        };
      } else if (bowlingScore >= 6) {
        return {
          role: 'Support Bowler',
          description: 'Reliable bowling performance',
          battingPosition: '9-11',
          bowlingRole: 'Full quota bowler'
        };
      } else if (bowlingScore >= 4) {
        return {
          role: 'Part-Time Bowler',
          description: 'Limited bowling contribution',
          battingPosition: '10-11',
          bowlingRole: 'Medium overs'
        };
      } else {
        return {
          role: 'Development Bowler',
          description: 'Minimal bowling contribution, needs improvement',
          battingPosition: '11',
          bowlingRole: 'Limited overs'
        };
      }
    } else {
      // Player with no participation in either department
      return {
        role: 'Inactive Player',
        description: 'No recent participation in batting or bowling',
        battingPosition: 'N/A',
        bowlingRole: 'N/A'
      };
    }
  };

  const battingCategory = getPerformanceCategory(battingScore);
  const bowlingCategory = getPerformanceCategory(bowlingScore);
  const roleRecommendation = getRoleRecommendation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {player.profileImage && (
              <img src={player.profileImage} alt={player.playerName} className="w-12 h-12 rounded-full object-cover" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{player.playerName}</h2>
              <p className="text-gray-600">Performance Analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
              <div className="text-lg text-gray-600">Overall Performance</div>
              <div className="text-sm text-gray-500">Score: {totalScore}/{maxPossibleScore}</div>
            </div>
          </div>

          {/* Role Recommendation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Recommendation</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Primary Role:</span>
                <span className="font-bold text-blue-600">{roleRecommendation.role}</span>
              </div>
              <div className="text-sm text-gray-700">{roleRecommendation.description}</div>
              <div className="flex justify-between text-sm flex-col">
                <span className="text-gray-700">Batting Position: {roleRecommendation.battingPosition}</span>
                <span className="text-gray-700">Bowling: {roleRecommendation.bowlingRole}</span>
              </div>
            </div>
          </div>

          {/* Batting Analysis */}
          {hasBatting && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Batting Analysis</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-600">Runs</div>
                  <div className="text-lg font-bold text-gray-900">{player.batting.runs}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-lg font-bold text-gray-900">{player.batting.average.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Strike Rate</div>
                  <div className="text-lg font-bold text-gray-900">{player.batting.strikeRate.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Innings</div>
                  <div className="text-lg font-bold text-gray-900">{player.batting.innings}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Performance Score:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{battingScore}/9</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${battingCategory.bg} ${battingCategory.color}`}>
                    {battingCategory.text}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bowling Analysis */}
          {hasBowling && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bowling Analysis</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-600">Wickets</div>
                  <div className="text-lg font-bold text-gray-900">{player.bowling.wickets}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-lg font-bold text-gray-900">{player.bowling.average.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Economy</div>
                  <div className="text-lg font-bold text-gray-900">{player.bowling.economy.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Innings</div>
                  <div className="text-lg font-bold text-gray-900">{player.bowling.innings}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Performance Score:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{bowlingScore}/9</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${bowlingCategory.bg} ${bowlingCategory.color}`}>
                    {bowlingCategory.text}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Breakdown */}
          {(hasBatting || hasBowling) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Breakdown</h3>
              <div className="space-y-3">
                {hasBatting && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Batting Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(battingScore / 9) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{battingScore}/9</span>
                    </div>
                  </div>
                )}
                {hasBowling && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Bowling Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(bowlingScore / 9) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{bowlingScore}/9</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerAnalysisModal; 