import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData } from "@/utils/JSONBlobUtils";

export async function GET(req: NextRequest) {
  try {
    const fundBlob = await getTeamFunData();
    const matchExpenseList = Array.isArray(fundBlob?.matchExpenseList) ? fundBlob.matchExpenseList : [];
    return NextResponse.json({ matchExpenseList });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch match expenses" }, { status: 500 });
  }
} 