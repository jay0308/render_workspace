import { NextRequest, NextResponse } from "next/server";
import { getJSONBlob, updateJSONBlob, BlobType } from "@/utils/JSONBlobUtils";
import { ContextualFactors } from "@/utils/constants";

export async function POST(req: NextRequest) {
  try {
    const raterId = req.headers.get("x-profile-id");
    const { ratings, matchId, playerId, comment } = await req.json();

    // Validate
    if (!matchId || !raterId || !playerId) {
      return NextResponse.json({ error: "Missing match id, rater id, or player id" }, { status: 400 });
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
    const blobData = await getJSONBlob(BlobType.MVP_DATA);
    if (!Array.isArray(blobData.matches)) {
      return NextResponse.json({ error: "No matches found" }, { status: 404 });
    }
    const matchIndex = blobData.matches.findIndex((m: any) => String(m.matchId) === String(matchId));
    if (matchIndex === -1) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const match = blobData.matches[matchIndex];
    
    if (!Array.isArray(match.counterstrikersMVPs)) {
      return NextResponse.json({ error: "No MVPs found for this match" }, { status: 404 });
    }
    const playerIndex = match.counterstrikersMVPs.findIndex((p: any) => String(p.player_id) === String(playerId));
    if (playerIndex === -1) {
      return NextResponse.json({ error: "Player not found in MVPs" }, { status: 404 });
    }
    const player = match.counterstrikersMVPs[playerIndex];

    // Initialize ratings array if it doesn't exist
    if (!Array.isArray(player.ratings)) {
      player.ratings = [];
    }

    // Find existing rating by the same rater
    const existingRatingIndex = player.ratings.findIndex((r: any) => r.raterId === raterId);

    // Create new rating object
    const newRating = {
      ratings: allRatings,
      comment: comment || "",
      submittedAt: new Date().toISOString(),
      raterId: raterId,
    };

    // Update or add the rating
    if (existingRatingIndex !== -1) {
      player.ratings[existingRatingIndex] = newRating;
    } else {
      player.ratings.push(newRating);
    }

    // Update the nested structure
    match.counterstrikersMVPs[playerIndex] = player;
    blobData.matches[matchIndex] = match;

    // Save the updated data
    await updateJSONBlob(BlobType.MVP_DATA, blobData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in submit-rating:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 