import { NextRequest, NextResponse } from "next/server";
import { updateTeamStats, getConfigData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    // Get current config to check admin ID
    const currentConfig = await getConfigData();
    
    // Check if user is admin (you can expand this to include other authorized users)
    const profileId = req.headers.get("x-profile-id");
    if (!profileId || profileId !== String(currentConfig.ADMIN_PROFILE_ID)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const teamStatsData = await req.json();
    
    // Validate required fields
    if (!teamStatsData.matches && !teamStatsData.battingStats && !teamStatsData.bowlingStats) {
      return NextResponse.json({ error: "At least one statistics section is required" }, { status: 400 });
    }

    // Add/update metadata
    const statsWithMetadata = {
      ...teamStatsData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: profileId
      }
    };

    await updateTeamStats(statsWithMetadata);
    
    return NextResponse.json({ 
      success: true, 
      message: "Team statistics updated successfully",
      lastUpdated: statsWithMetadata.metadata.lastUpdated
    });
  } catch (error) {
    console.error("Error updating team stats:", error);
    return NextResponse.json({ error: "Failed to update team statistics" }, { status: 500 });
  }
} 