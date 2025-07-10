import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { id, amounts, skipBalance } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing fund id" }, { status: 400 });
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
    // Fetch current fund list
    const fundBlob = await getTeamFunData();
    const fundList = fundBlob?.fundList;
    if (!Array.isArray(fundList)) {
      return NextResponse.json({ error: "Fund list not found" }, { status: 404 });
    }
    const updatedList = fundList.filter((f: any) => String(f.id) !== String(id));
    // Deduct the sum of amounts from totalBalance if provided and not skipping balance
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    if (!skipBalance && amounts && typeof amounts === 'object') {
      let sum = 0;
      for (const key in amounts) {
        if (Object.prototype.hasOwnProperty.call(amounts, key)) {
          const val = Number(amounts[key]);
          if (!isNaN(val) && val > 0) sum += val;
        }
      }
      totalBalance -= sum;
    }
    await updateTeamFunData({ ...fundBlob, fundList: updatedList, totalBalance });
    return NextResponse.json({ success: true, funds: updatedList, totalBalance });
  } catch (error) {
    console.error("Error deleting fund:", error);
    return NextResponse.json({ error: "Failed to delete fund" }, { status: 500 });
  }
} 