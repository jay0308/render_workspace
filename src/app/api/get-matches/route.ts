import { NextRequest, NextResponse } from "next/server";
import { getJSONBlob, BlobType } from "@/utils/JSONBlobUtils";

function calculateAverageRating(ratingsArr: any[]): number {
  if (!Array.isArray(ratingsArr) || ratingsArr.length === 0) return 0;
  let sum = 0;
  let count = 0;
  for (const r of ratingsArr) {
    if (r && typeof r.ratings === "object") {
      for (const val of Object.values(r.ratings)) {
        if (typeof val === "number" && val > 0) {
          sum += val;
          count++;
        }
      }
    }
  }
  return count > 0 ? Math.round((sum / count) * 10000) / 10000 : 0;
}

function round4(val: number) {
  return Math.round(val * 10000) / 10000;
}

export async function GET(req: NextRequest) {
  try {
    const blobData = await getJSONBlob(BlobType.MVP_DATA);
    const matches = Array.isArray(blobData.matches) ? blobData.matches : [];
    const filteredMatches = matches;

    // 1. Calculate enrich_mvp for each MVP in each match
    for (const match of filteredMatches) {
      if (Array.isArray(match.counterstrikersMVPs)) {
        for (const mvp of match.counterstrikersMVPs) {
          const total = parseFloat(mvp.total) || 0;
          const avgRating = calculateAverageRating(mvp.ratings);
          mvp.enrich_mvp = round4(0.7 * total + 0.3 * avgRating);
          mvp.avg_rating = avgRating;
        }
      }
    }

    // 2. Best player of each match by enrich_mvp
    const bestPlayerPerMatch = filteredMatches.map((match: any) => {
      if (!Array.isArray(match.counterstrikersMVPs) || match.counterstrikersMVPs.length === 0) return null;
      let best = match.counterstrikersMVPs[0];
      for (const mvp of match.counterstrikersMVPs) {
        if ((mvp.enrich_mvp ?? 0) > (best.enrich_mvp ?? 0)) best = mvp;
      }
      return { matchId: match.matchId, player: best };
    }).filter(Boolean);

    // 3. Best player of all matches by averaging enrich_mvp
    const playerStats: Record<string, { player: any; enrich_mvp_sum: number; count: number }> = {};
    for (const match of filteredMatches) {
      if (Array.isArray(match.counterstrikersMVPs)) {
        for (const mvp of match.counterstrikersMVPs) {
          const key = String(mvp.player_id);
          if (!playerStats[key]) {
            playerStats[key] = { player: mvp, enrich_mvp_sum: 0, count: 0 };
          }
          playerStats[key].enrich_mvp_sum += parseFloat(mvp.enrich_mvp) || 0;
          playerStats[key].count++;
        }
      }
    }
    
    // Calculate averages and store them in a lookup map
    const playerAvgMap: Record<string, number> = {};
    Object.values(playerStats).forEach(stat => {
      const avg = stat.count > 0 ? round4(stat.enrich_mvp_sum / stat.count) : 0;
      stat.player.avg_enrich_mvp = avg;
      playerAvgMap[stat.player.player_id] = avg;
    });

    // Determine the best overall player by a weighted score (match count * avg MVP)
    let bestOverallPlayer = null;
    let maxWeightedScore = -1;

    for (const stat of Object.values(playerStats)) {
      const weightedScore = stat.count * stat.player.avg_enrich_mvp;
      if (weightedScore > maxWeightedScore) {
        maxWeightedScore = weightedScore;
        bestOverallPlayer = stat.player;
      }
    }

    return NextResponse.json({
      matches: filteredMatches,
      bestPlayerPerMatch,
      bestOverallPlayer,
    });
  } catch (error) {
    return NextResponse.json({ matches: [], error: (error as Error).message }, { status: 200 });
  }
} 