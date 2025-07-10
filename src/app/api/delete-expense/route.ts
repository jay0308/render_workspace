import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { id, amount, clearOnly } = await req.json();
    if (!id || (!clearOnly && (!amount || isNaN(Number(amount))))) {
      return NextResponse.json({ error: "Missing or invalid expense id/amount" }, { status: 400 });
    }
    const fundBlob = await getTeamFunData();
    const expenseList = Array.isArray(fundBlob?.expenseList) ? fundBlob.expenseList : [];
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    let totalExpense = typeof fundBlob?.totalExpense === 'number' ? fundBlob.totalExpense : 0;
    const updatedExpenseList = expenseList.filter((exp: any) => exp.id !== id);
    if (clearOnly) {
      // Just remove, do not touch totals
      await updateTeamFunData({ ...fundBlob, expenseList: updatedExpenseList });
      return NextResponse.json({ success: true, expenseList: updatedExpenseList, totalBalance, totalExpense });
    }
    totalBalance += Number(amount);
    totalExpense -= Number(amount);
    if (totalExpense < 0) totalExpense = 0;
    await updateTeamFunData({ ...fundBlob, expenseList: updatedExpenseList, totalBalance, totalExpense });
    return NextResponse.json({ success: true, expenseList: updatedExpenseList, totalBalance, totalExpense });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
} 