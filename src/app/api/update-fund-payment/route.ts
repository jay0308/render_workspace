import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { fundId, playerId, status } = await req.json();
    if (!fundId || !playerId || (status !== 'paid' && status !== 'unpaid')) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // Get team config to find admin/fund manager IDs
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID;
    const fundManagerId = config?.FUND_MANAGER_PROFILE_ID;
    // Check profile id from headers
    const profileId = req.headers.get("x-profile-id");
    if (!profileId || (String(profileId) !== String(adminId) && String(profileId) !== String(fundManagerId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Fetch current fund list and total balance
    const fundBlob = await getTeamFunData();
    const fundList = Array.isArray(fundBlob?.fundList) ? fundBlob.fundList : [];
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    let amountToAdd = 0;
    let amountToDeduct = 0;
    const updatedList = fundList.map((fund: any) => {
      if (String(fund.id) === String(fundId) && fund.payments && fund.payments[playerId] !== undefined) {
        // Add to totalBalance if marking as paid and previous status was unpaid
        if (fund.payments[playerId] === 'unpaid' && status === 'paid') {
          amountToAdd = Number(fund.amount) || 0;
        }
        // Deduct from totalBalance if marking as unpaid and previous status was paid
        if (fund.payments[playerId] === 'paid' && status === 'unpaid') {
          amountToDeduct = Number(fund.amount) || 0;
        }
        return {
          ...fund,
          payments: {
            ...fund.payments,
            [playerId]: status
          }
        };
      }
      return fund;
    });
    if (amountToAdd > 0) {
      totalBalance += amountToAdd;
    }
    if (amountToDeduct > 0) {
      totalBalance -= amountToDeduct;
      if (totalBalance < 0) totalBalance = 0;
    }
    await updateTeamFunData({ ...fundBlob, fundList: updatedList, totalBalance });
    return NextResponse.json({ success: true, funds: updatedList, totalBalance });
  } catch (error) {
    console.error("Error updating fund payment status:", error);
    return NextResponse.json({ error: "Failed to update payment status" }, { status: 500 });
  }
} 