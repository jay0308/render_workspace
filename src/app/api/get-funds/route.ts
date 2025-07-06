import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData } from "@/utils/JSONBlobUtils";

export async function GET(req: NextRequest) {
  try {
    const fundBlob = await getTeamFunData();
    const fundList = Array.isArray(fundBlob?.fundList) ? fundBlob.fundList : [];
    const totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    return NextResponse.json({ fundList, totalBalance });
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json({ fundList: [], totalBalance: 0 }, { status: 500 });
  }
} 