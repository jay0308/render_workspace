import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { id, amount } = await req.json();
    if (!id || !amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Missing or invalid expense id/amount" }, { status: 400 });
    }
    const fundBlob = await getTeamFunData();
    const expenseList = Array.isArray(fundBlob?.expenseList) ? fundBlob.expenseList : [];
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    const updatedExpenseList = expenseList.filter((exp: any) => exp.id !== id);
    totalBalance += Number(amount);
    await updateTeamFunData({ ...fundBlob, expenseList: updatedExpenseList, totalBalance });
    return NextResponse.json({ success: true, expenseList: updatedExpenseList, totalBalance });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
} 