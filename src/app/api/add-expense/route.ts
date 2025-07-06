import { NextRequest, NextResponse } from "next/server";
import { getConfigData, getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { description, amount } = await req.json();
    if (!description || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Missing or invalid expense details" }, { status: 400 });
    }
    // Get team config to find admin/fund manager IDs
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID;
    const fundManagerId = config?.FUND_MANAGER_PROFILE_ID;
    // Check profile id from headers
    // (optional: add permission check if needed)
    // Fetch current fund blob
    const fundBlob = await getTeamFunData();
    const expenseList = Array.isArray(fundBlob?.expenseList) ? fundBlob.expenseList : [];
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    // Create new expense
    const newExpense = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      description,
      amount: Number(amount),
      createdDate: new Date().toISOString(),
    };
    // Add to expense list
    const updatedExpenseList = [newExpense, ...expenseList];
    // Deduct from total balance
    totalBalance -= Number(amount);
    // Save
    await updateTeamFunData({ ...fundBlob, expenseList: updatedExpenseList, totalBalance });
    return NextResponse.json({ success: true, expenseList: updatedExpenseList, totalBalance });
  } catch (error) {
    console.error("Error adding expense:", error);
    return NextResponse.json({ error: "Failed to add expense" }, { status: 500 });
  }
} 