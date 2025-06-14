import { NextRequest, NextResponse } from "next/server";
import { updateConfigData, getConfigData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    // Get current config to check admin ID
    const currentConfig = await getConfigData();
    
    // Check if user is admin (you can expand this to include other authorized users)
    const profileId = req.headers.get("x-profile-id");
    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized - Profile ID required" }, { status: 403 });
    }

    const isAdmin = profileId === String(currentConfig.ADMIN_PROFILE_ID);
    const isAwardUser = currentConfig.AWARD_NOW_VISIBLITY_PROFILE_ID.includes(Number(profileId));
    if (!isAdmin && !isAwardUser) {
      return NextResponse.json({ error: "Unauthorized - Admin or award user access required" }, { status: 403 });
    }

    const teamConfigData = await req.json();
    
    // Validate required fields
    if (!teamConfigData.battingOrder || !teamConfigData.benchmarks || !teamConfigData.teamRules) {
      return NextResponse.json({ error: "Missing required team configuration data" }, { status: 400 });
    }

    // Add/update metadata
    const configWithMetadata = {
      ...teamConfigData,
      metadata: {
        ...teamConfigData.metadata,
        lastUpdated: new Date().toISOString(),
        teamName: teamConfigData.metadata?.teamName || "Counterstrikers",
        version: teamConfigData.metadata?.version || "1.0",
        evaluationFrequency: teamConfigData.metadata?.evaluationFrequency || "7-8 innings",
        decisionAuthority: teamConfigData.metadata?.decisionAuthority || ["Captain", "Vice-Captain"]
      }
    };

    await updateConfigData(configWithMetadata);
    
    return NextResponse.json({ 
      success: true, 
      message: "Team configuration updated successfully",
      lastUpdated: configWithMetadata.metadata.lastUpdated
    });
  } catch (error) {
    console.error("Error updating team config:", error);
    return NextResponse.json({ error: "Failed to update team configuration" }, { status: 500 });
  }
} 