import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { description, matchFees, dueDate, players, paidBy } = await req.json();
    const profileId = req.headers.get("x-profile-id");
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID;
    const matchFundManagerId = config?.MATCH_FUND_MANAGER_PROFILE_ID;
    // Check permission: admin or match fund manager
    const isMatchFundManager = matchFundManagerId && (
      Array.isArray(matchFundManagerId)
        ? matchFundManagerId.map(String).includes(String(profileId))
        : String(matchFundManagerId) === String(profileId)
    );
    if (!profileId || (String(profileId) !== String(adminId) && !isMatchFundManager)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!description || !matchFees || isNaN(Number(matchFees)) || Number(matchFees) <= 0 || !dueDate || !Array.isArray(players) || players.length === 0 || !paidBy) {
      return NextResponse.json({ error: "Missing or invalid match expense details" }, { status: 400 });
    }
    // Fetch current fund blob
    const fundBlob = await getTeamFunData();
    const matchExpenseList = Array.isArray(fundBlob?.matchExpenseList) ? fundBlob.matchExpenseList : [];
    // Create new match expense
    const newExpense = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      description,
      amount: Number(matchFees),
      createdDate: new Date().toISOString(),
      type: 'match',
      players,
      paidBy,
      dueDate,
      matchFees: Number(matchFees)
    };
    // Add to match expense list
    const updatedMatchExpenseList = [newExpense, ...matchExpenseList];
    // Save only matchExpenseList, do not touch totalBalance
    await updateTeamFunData({ ...fundBlob, matchExpenseList: updatedMatchExpenseList });
    return NextResponse.json({ success: true, matchExpenseList: updatedMatchExpenseList });
  } catch (error) {
    console.error("Error adding match expense:", error);
    return NextResponse.json({ error: "Failed to add match expense" }, { status: 500 });
  }
} 