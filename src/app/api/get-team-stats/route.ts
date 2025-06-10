import { NextRequest, NextResponse } from "next/server";
import { getTeamStats } from "@/utils/JSONBlobUtils";

export async function GET(req: NextRequest) {
  try {
    const teamStatsData = await getTeamStats();
    return NextResponse.json(teamStatsData);
  } catch (error) {
    console.error("Error fetching team stats:", error);
    // Return empty data structure if blob is empty or fails
    const fallbackData = {
      matches: [],
      battingStats: [],
      bowlingStats: []
    };
    return NextResponse.json(fallbackData);
  }
} 