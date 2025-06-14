import { NextRequest, NextResponse } from "next/server";
import { updateTeamStats, getConfigData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    // Get current config to check permissions
    const currentConfig = await getConfigData();
    
    // Check if user has permission (admin or award visibility users)
    const profileId = req.headers.get("x-profile-id");
    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized - Profile ID required" }, { status: 403 });
    }

    const isAdmin = profileId === String(currentConfig.ADMIN_PROFILE_ID);
    const isAwardUser = currentConfig.AWARD_NOW_VISIBLITY_PROFILE_ID.includes(Number(profileId));
    if (!isAdmin && !isAwardUser) {
      return NextResponse.json({ error: "Unauthorized - Admin or award user access required" }, { status: 403 });
    }

    // Clear team stats by resetting to empty structure
    const clearedStats = {
      matches: [],
      battingStats: [],
      bowlingStats: [],
      aggregatedBattingStats: [],
      aggregatedBowlingStats: [],
      metadata: {
        lastCleared: new Date().toISOString(),
        clearedBy: profileId,
        totalMatches: 0
      }
    };

    await updateTeamStats(clearedStats);
    
    return NextResponse.json({ 
      success: true,
      message: "Team statistics cleared successfully",
      clearedAt: clearedStats.metadata.lastCleared
    });

  } catch (error) {
    console.error("Error clearing team stats:", error);
    return NextResponse.json({ 
      error: "Failed to clear team statistics",
      details: (error as Error).message 
    }, { status: 500 });
  }
} 