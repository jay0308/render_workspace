import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData } from "@/utils/JSONBlobUtils";

export async function GET(req: NextRequest) {
  try {
    const fundBlob = await getTeamFunData();
    const expenseList = Array.isArray(fundBlob?.expenseList) ? fundBlob.expenseList : [];
    const totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    const totalExpense = typeof fundBlob?.totalExpense === 'number' ? fundBlob.totalExpense : 0;
    return NextResponse.json({ expenseList, totalBalance, totalExpense });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
} 