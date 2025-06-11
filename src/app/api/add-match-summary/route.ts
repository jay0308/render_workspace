import { NextRequest, NextResponse } from "next/server";
import { getMVPData, updateMVPData, getConfigData } from "@/utils/JSONBlobUtils";

async function generateMatchData(parsedData: any) {
  console.log(parsedData);
  // Extract match summary
  const summaryData = parsedData?.props?.pageProps?.summaryData?.data;
  const mvpData = parsedData?.props?.pageProps?.mvp?.data;
  if (!summaryData || !mvpData) throw new Error("Invalid match data structure");

  // Get team ID from config
  const config = await getConfigData();
  
  // Filter MVPs for Counterstrikers
  const counterstrikersMVPs = mvpData.filter((mvp: any) => mvp.team_id === config.COUNTERSTRIKERS_TEAM_ID);

  // Prepare match summary (as shown on UI)
  const matchSummary = {
    tournamentName: summaryData.tournament_name,
    roundName: summaryData.tournament_round_name,
    groundName: summaryData.ground_name,
    cityName: summaryData.city_name,
    matchType: summaryData.match_type,
    overs: summaryData.overs,
    startDateTime: summaryData.start_datetime,
    tossDetails: summaryData.toss_details,
    teamA: summaryData.team_a,
    teamB: summaryData.team_b,
    matchSummary: summaryData.match_summary.summary,
    matchResult: summaryData.status,
    tinyShareUrl: summaryData.tiny_share_url,
  };

  return {
    matchSummary,
    counterstrikersMVPs,
    matchId: summaryData.match_id,
    createdAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { matchDataJSONString:jsonString } = await req.json();
    if (!jsonString) {
      return NextResponse.json({ error: "jsonString is required" }, { status: 400 });
    }

    // Parse the JSON string
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse JSON string" }, { status: 500 });
    }

    // 1. Generate match data
    let matchData;
    try {
      matchData = await generateMatchData(parsedData);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to generate match data" }, { status: 500 });
    }

    // 2. Get data from JSONBlob
    let blobData;
    try {
      blobData = await getMVPData();
    } catch (e: any) {
      blobData = {};
    }

    // Check if match already exists
    if (Array.isArray(blobData.matches)) {
      const alreadyExists = blobData.matches.some((m: any) => m.matchId === matchData.matchId);
      if (alreadyExists) {
        return NextResponse.json({ error: "Match already exists" }, { status: 400 });
      }
      blobData.matches.push(matchData);
    } else {
      blobData.matches = [matchData];
    }

    // 3. Update JSONBlob
    try {
      await updateMVPData(blobData);
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to update JSONBlob" }, { status: 500 });
    }

    return NextResponse.json({ success: true, matchData });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 