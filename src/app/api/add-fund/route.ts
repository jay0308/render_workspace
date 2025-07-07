import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const fund = await req.json();
    if (!fund || !fund.description || !fund.amount || !fund.dueDate || !Array.isArray(fund.players)) {
      return NextResponse.json({ error: "Missing required fund details" }, { status: 400 });
    }
    // Get team config to find the fund JSON blob ID and admin/fund manager IDs
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID;
    const fundManagerId = config?.FUND_MANAGER_PROFILE_ID;
    // Check profile id from headers
    const profileId = req.headers.get("x-profile-id");
    if (!profileId || (String(profileId) !== String(adminId) && String(profileId) !== String(fundManagerId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Fetch current fund list
    const fundBlob = await getTeamFunData();
    const fundList = Array.isArray(fundBlob?.fundList) ? fundBlob.fundList : [];
    // Add created date
    const createdDate = new Date().toISOString();
    let newFund: any;
    let updatedList: any[];
    if (fund.id) {
      // Modify existing fund
      const oldFund = fundList.find((f: any) => String(f.id) === String(fund.id));
      let payments: Record<string, 'paid' | 'unpaid'> = {};
      if (oldFund && oldFund.payments) {
        payments = { ...oldFund.payments };
      }
      const newPlayers: string[] = Array.isArray(fund.players) ? fund.players : [];
      const paymentKeys: string[] = Object.keys(payments) as string[];
      for (const pid of paymentKeys) {
        if (!newPlayers.includes(pid)) delete payments[pid];
      }
      newPlayers.forEach(pid => {
        if (!payments[pid]) payments[pid] = 'unpaid';
      });
      newFund = { ...fund, createdDate, payments };
      updatedList = fundList.map((f: any) => String(f.id) === String(fund.id) ? { ...f, ...newFund } : f);
    } else {
      // Create new fund with unique id
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const payments: Record<string, 'paid' | 'unpaid'> = {};
      (Array.isArray(fund.players) ? fund.players : []).forEach((pid: any) => { payments[pid] = 'unpaid'; });
      newFund = { ...fund, createdDate, id: uniqueId, payments };
      updatedList = [newFund, ...fundList];
    }
    // Save updated list, preserving other properties in fundBlob
    await updateTeamFunData({ ...fundBlob, fundList: updatedList });
    return NextResponse.json({ success: true, fund: newFund, funds: updatedList });
  } catch (error) {
    console.error("Error saving fund:", error);
    return NextResponse.json({ error: "Failed to save fund" }, { status: 500 });
  }
} 