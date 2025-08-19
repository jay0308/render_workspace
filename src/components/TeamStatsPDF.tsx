import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { TeamStatsData } from '../contexts/TeamStatsContext';

// Use default fonts to avoid potential loading issues
// Font.register({
//   family: 'Helvetica',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
//     { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' }
//   ]
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    borderBottom: '1px solid #d1d5db',
    paddingBottom: 5
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 15
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 25
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    fontSize: 10,
    textAlign: 'left',
    flex: 1
  },
  tableCellHeader: {
    fontWeight: 'bold',
    color: '#374151'
  },

  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    marginTop: 20
  }
});

interface TeamStatsPDFProps {
  teamStats: TeamStatsData;
  teamName?: string;
  teamConfig?: any; // Add team config for performance calculation
}

const TeamStatsPDF: React.FC<TeamStatsPDFProps> = ({ teamStats, teamName = 'CounterStrikers', teamConfig }) => {
  // Calculate match statistics
  const totalMatches = teamStats?.matches?.length || 0;
  const wins = teamStats?.matches?.filter(match => match.winningTeam === 'CounterStrikers').length || 0;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

  // Get sorted batting stats
  const sortedBattingStats = teamStats?.aggregatedBattingStats?.sort((a, b) => b.totalRuns - a.totalRuns) || [];
  
  // Get sorted bowling stats
  const sortedBowlingStats = teamStats?.aggregatedBowlingStats?.sort((a, b) => b.totalWickets - a.totalWickets) || [];

  // Check if player is an all-rounder (appears in both batting and bowling stats)
  const isAllRounder = (playerId: any) => {
    const hasBatting = teamStats?.aggregatedBattingStats?.some((p: any) => p.playerId === playerId);
    const hasBowling = teamStats?.aggregatedBowlingStats?.some((p: any) => p.playerId === playerId);
    return hasBatting && hasBowling;
  };

  // Get batting performance score (0-9) - Same logic as TeamStatsTab
  const getBattingScore = (player: any) => {
    if (!teamConfig) return 0;
    
    const { average, strikeRate, totalRuns, innings } = player;
    const configAverage = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20;
    const configStrikeRate = teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100;
    
    const avgThreshold = { excellent: configAverage * 1.5, average: configAverage };
    const srThreshold = { excellent: configStrikeRate * 1.3, average: configStrikeRate };
    const runsThreshold = { excellent: Math.max(100, innings * 25), average: Math.max(50, innings * 15) };
    
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

  // Get bowling performance score (0-9) - Same logic as TeamStatsTab
  const getBowlingScore = (player: any) => {
    if (!teamConfig) return 0;
    
    const { economyRate, bowlingAverage, totalWickets, innings } = player;
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
      excellent: Math.max(6, innings * 1.5),
      average: Math.max(3, innings * 0.8)
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

  // Performance categorization function - Same logic as TeamStatsTab
  const getPerformanceCategory = (player: any, isBattingPlayer: boolean = true) => {
    if (!teamConfig) return 'Unknown';
    
    // Check if player is an all-rounder
    if (isAllRounder(player.playerId)) {
      const battingScore = getBattingScore(player);
      const bowlingPlayer = teamStats?.aggregatedBowlingStats?.find((p: any) => p.playerId === player.playerId);
      const bowlingScore = bowlingPlayer ? getBowlingScore(bowlingPlayer) : 0;
      
      // Combined score for all-rounders (weighted average)
      const combinedScore = (battingScore + bowlingScore) / 2;
      
      // More lenient thresholds for all-rounders
      if (combinedScore >= 6.5) return 'Excellent';
      if (combinedScore >= 4.5) return 'Average';
      return 'Underperformer';
    }
    
    // For specialists, use their primary skill score
    if (isBattingPlayer) {
      const battingScore = getBattingScore(player);
      if (battingScore >= 8) return 'Excellent';
      if (battingScore >= 6) return 'Average';
      return 'Underperformer';
    } else {
      const bowlingScore = getBowlingScore(player);
      if (bowlingScore >= 8) return 'Excellent';
      if (bowlingScore >= 6) return 'Average';
      return 'Underperformer';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>{teamName} - Team Statistics Report</Text>
        
        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Summary</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Metric</Text>
              <Text style={[styles.tableCell, styles.tableCellHeader]}>Value</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Total Matches</Text>
              <Text style={styles.tableCell}>{totalMatches}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Wins</Text>
              <Text style={styles.tableCell}>{wins}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Losses</Text>
              <Text style={styles.tableCell}>{losses}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Win Rate</Text>
              <Text style={styles.tableCell}>{winRate}%</Text>
            </View>
          </View>
        </View>

        {/* Batting Statistics */}
        {sortedBattingStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batting Statistics</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Player</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Runs</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Avg</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>SR</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>4s/6s</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Innings</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Performance</Text>
              </View>
              
              {/* Table Rows */}
              {sortedBattingStats.map((player, index) => {
                const performance = getPerformanceCategory(player, true); // true for batting player
                const performanceColor = performance === 'Excellent' ? '#059669' : 
                                       performance === 'Average' ? '#d97706' : '#dc2626';
                
                return (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{player.playerName}</Text>
                    <Text style={styles.tableCell}>{player.totalRuns}</Text>
                    <Text style={styles.tableCell}>{player.average.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>{player.strikeRate.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>{player.totalFours}/{player.totalSixes}</Text>
                    <Text style={styles.tableCell}>{player.innings}</Text>
                    <Text style={[styles.tableCell, { color: performanceColor }]}>{performance}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Bowling Statistics */}
        {sortedBowlingStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bowling Statistics</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Player</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Wickets</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Avg</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Econ</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Overs</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Innings</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Performance</Text>
              </View>
              
              {/* Table Rows */}
              {sortedBowlingStats.map((player, index) => {
                const performance = getPerformanceCategory(player, false); // false for bowling player
                const performanceColor = performance === 'Excellent' ? '#059669' : 
                                       performance === 'Average' ? '#d97706' : '#dc2626';
                
                return (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>{player.playerName}</Text>
                    <Text style={styles.tableCell}>{player.totalWickets}</Text>
                    <Text style={styles.tableCell}>
                      {player.bowlingAverage > 0 ? player.bowlingAverage.toFixed(2) : '-'}
                    </Text>
                    <Text style={styles.tableCell}>{player.economyRate.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>
                      {Math.floor(player.totalBalls / 6)}.{player.totalBalls % 6}
                    </Text>
                    <Text style={styles.tableCell}>{player.innings}</Text>
                    <Text style={[styles.tableCell, { color: performanceColor }]}>{performance}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Matches */}
        {teamStats?.matches && teamStats.matches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Match Results</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Opponent</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Result</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Score</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Date</Text>
              </View>
              
              {/* Table Rows - Show last 10 matches */}
              {teamStats.matches
                .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime())
                .slice(0, 10)
                .map((match, index) => {
                  const isWin = match.winningTeam === 'CounterStrikers';
                  const matchDate = new Date(match.startDateTime).toLocaleDateString();
                  
                  return (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{match.scorecard.opponent}</Text>
                      <Text style={[styles.tableCell, { color: isWin ? '#059669' : '#dc2626' }]}>
                        {isWin ? 'Won' : 'Lost'}
                      </Text>
                      <Text style={styles.tableCell}>
                        {match.scorecard.teamScore} vs {match.scorecard.opponentScore}
                      </Text>
                      <Text style={styles.tableCell}>{matchDate}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Performance Legend */}
        {teamConfig && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Categories & Benchmarks</Text>
            <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, textAlign: 'center' }}>
              Performance ratings are color-coded: 🟢 Excellent (Green) | 🟡 Average (Yellow) | 🔴 Underperformer (Red)
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Category</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Description</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Score Range</Text>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, backgroundColor: '#059669', marginRight: 8 }}></View>
                    <Text style={{ color: '#059669' }}>Excellent</Text>
                  </View>
                </View>
                <Text style={styles.tableCell}>Outstanding performance in both batting and bowling</Text>
                <Text style={styles.tableCell}>6.5+ out of 9</Text>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, backgroundColor: '#d97706', marginRight: 8 }}></View>
                    <Text style={{ color: '#d97706' }}>Average</Text>
                  </View>
                </View>
                <Text style={styles.tableCell}>Good performance with room for improvement</Text>
                <Text style={styles.tableCell}>4.5 - 6.4 out of 9</Text>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, backgroundColor: '#dc2626', marginRight: 8 }}></View>
                    <Text style={{ color: '#dc2626' }}>Underperformer</Text>
                  </View>
                </View>
                <Text style={styles.tableCell}>Below expected performance level</Text>
                <Text style={styles.tableCell}>Below 4.5 out of 9</Text>
              </View>
            </View>
            
            {/* Benchmarks */}
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Skill</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Benchmark</Text>
                <Text style={[styles.tableCell, styles.tableCellHeader]}>Target</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Batting Average</Text>
                <Text style={styles.tableCell}>Minimum</Text>
                <Text style={styles.tableCell}>{teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumAverage || 20}+ runs</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Batting Strike Rate</Text>
                <Text style={styles.tableCell}>Minimum</Text>
                <Text style={styles.tableCell}>{teamConfig.additionalInfo?.evaluationCriteria?.batting?.topOrder?.minimumStrikeRate || 100}+</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Bowling Economy</Text>
                <Text style={styles.tableCell}>Maximum</Text>
                <Text style={styles.tableCell}>≤{teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumEconomy || 10.5}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Bowling Average</Text>
                <Text style={styles.tableCell}>Maximum</Text>
                <Text style={styles.tableCell}>&lt;{teamConfig.additionalInfo?.evaluationCriteria?.bowling?.fullTime?.maximumAverage || 30}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </Page>
    </Document>
  );
};

// Function to generate and download PDF
export const generateTeamStatsPDF = async (teamStats: TeamStatsData, teamName?: string, teamConfig?: any) => {
  try {
    const blob = await pdf(<TeamStatsPDF teamStats={teamStats} teamName={teamName} teamConfig={teamConfig} />).toBlob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${teamName || 'Team'}_Statistics_${new Date().toISOString().split('T')[0]}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export default TeamStatsPDF;
