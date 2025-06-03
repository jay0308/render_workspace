import { NextRequest, NextResponse } from "next/server";
import { getJSONBlob, updateJSONBlob } from "@/utils/JSONBlobUtils";
import { ContextualFactors } from "@/utils/constants";

export async function POST(req: NextRequest) {
  try {
    const playerId = req.headers.get("x-player-id");
    const { ratings, matchId } = await req.json();

    // Validate
    if (!matchId || !playerId) {
      return NextResponse.json({ error: "Missing match id or player id" }, { status: 400 });
    }
    if (!ratings || typeof ratings !== "object") {
      return NextResponse.json({ error: "Missing or invalid ratings" }, { status: 400 });
    }
    // Fill missing ContextualFactors with 0
    const allRatings: Record<string, number> = {};
    let anyFilled = false;
    for (const key of Object.keys(ContextualFactors)) {
      if (typeof ratings[key] === "number" && ratings[key] > 0 && ratings[key] <= 10) {
        allRatings[key] = ratings[key];
        anyFilled = true;
      } else {
        allRatings[key] = 0;
      }
    }
    if (!anyFilled) {
      return NextResponse.json({ error: "At least one category must be rated" }, { status: 400 });
    }

    // Fetch and update JSONBlob
    const blobData = await getJSONBlob();
    if (!Array.isArray(blobData.matches)) {
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }
    const match = blobData.matches.find((m: any) => String(m.matchId) === String(matchId));
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (!Array.isArray(match.counterstrikersMVPs)) {
      return NextResponse.json({ error: "No MVPs found for this match" }, { status: 404 });
    }
    const player = match.counterstrikersMVPs.find((p: any) => String(p.player_id) === String(playerId));
    if (!player) {
      return NextResponse.json({ error: "Player not found in MVPs" }, { status: 404 });
    }
    // Save ratings (can be an array to allow multiple ratings, or just one per user)
    if (!Array.isArray(player.ratings)) player.ratings = [];
    player.ratings.push({
      ratings: allRatings,
      submittedAt: new Date().toISOString(),
    });
    await updateJSONBlob(blobData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 