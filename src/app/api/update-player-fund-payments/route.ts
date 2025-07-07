import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { playerId, fundIds, status, amounts } = await req.json();
    if (!playerId || !Array.isArray(fundIds) || fundIds.length === 0 || (status !== 'paid' && status !== 'unpaid')) {
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
      if (fundIds.includes(fund.id) && fund.payments && fund.payments[playerId] !== undefined) {
        const updateAmount = (amounts && typeof amounts[fund.id] === 'number') ? amounts[fund.id] : (Number(fund.amount) || 0);
        // Add to totalBalance if marking as paid and previous status was unpaid
        if (fund.payments[playerId] === 'unpaid' && status === 'paid') {
          amountToAdd += updateAmount;
        }
        // Deduct from totalBalance if marking as unpaid and previous status was paid
        if (fund.payments[playerId] === 'paid' && status === 'unpaid') {
          amountToDeduct += updateAmount;
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
    totalBalance += amountToAdd;
    totalBalance -= amountToDeduct;
    if (totalBalance < 0) totalBalance = 0;
    await updateTeamFunData({ ...fundBlob, fundList: updatedList, totalBalance });
    return NextResponse.json({ success: true, funds: updatedList, totalBalance });
  } catch (error) {
    console.error("Error updating player fund payments:", error);
    return NextResponse.json({ error: "Failed to update player fund payments" }, { status: 500 });
  }
} 