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
    display: 'table',
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
    minHeight: 25,
    alignItems: 'center'
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
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10
  }
});

interface TeamStatsPDFProps {
  teamStats: TeamStatsData;
  teamName?: string;
}

const TeamStatsPDF: React.FC<TeamStatsPDFProps> = ({ teamStats, teamName = 'CounterStrikers' }) => {
  // Calculate match statistics
  const totalMatches = teamStats?.matches?.length || 0;
  const wins = teamStats?.matches?.filter(match => match.winningTeam === 'CounterStrikers').length || 0;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';

  // Get sorted batting stats
  const sortedBattingStats = teamStats?.aggregatedBattingStats?.sort((a, b) => b.totalRuns - a.totalRuns) || [];
  
  // Get sorted bowling stats
  const sortedBowlingStats = teamStats?.aggregatedBowlingStats?.sort((a, b) => b.totalWickets - a.totalWickets) || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>{teamName} - Team Statistics Report</Text>
        
        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Summary</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalMatches}</Text>
              <Text style={styles.summaryLabel}>Total Matches</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{wins}</Text>
              <Text style={styles.summaryLabel}>Wins</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{losses}</Text>
              <Text style={styles.summaryLabel}>Losses</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{winRate}%</Text>
              <Text style={styles.summaryLabel}>Win Rate</Text>
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
              </View>
              
              {/* Table Rows */}
              {sortedBattingStats.map((player, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{player.playerName}</Text>
                  <Text style={styles.tableCell}>{player.totalRuns}</Text>
                  <Text style={styles.tableCell}>{player.average.toFixed(2)}</Text>
                  <Text style={styles.tableCell}>{player.strikeRate.toFixed(2)}</Text>
                  <Text style={styles.tableCell}>{player.totalFours}/{player.totalSixes}</Text>
                  <Text style={styles.tableCell}>{player.innings}</Text>
                </View>
              ))}
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
              </View>
              
              {/* Table Rows */}
              {sortedBowlingStats.map((player, index) => (
                <View key={index} style={styles.tableRow}>
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
                </View>
              ))}
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
                    <View key={index} style={styles.tableRow}>
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

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </Text>
      </Page>
    </Document>
  );
};

// Function to generate and download PDF
export const generateTeamStatsPDF = async (teamStats: TeamStatsData, teamName?: string) => {
  try {
    const blob = await pdf(<TeamStatsPDF teamStats={teamStats} teamName={teamName} />).toBlob();
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
