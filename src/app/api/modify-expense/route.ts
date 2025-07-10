import { NextRequest, NextResponse } from "next/server";
import { getTeamFunData, updateTeamFunData } from "@/utils/JSONBlobUtils";

export async function POST(req: NextRequest) {
  try {
    const { id, description, amount } = await req.json();
    if (!id || !description || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Missing or invalid expense details" }, { status: 400 });
    }
    const fundBlob = await getTeamFunData();
    const expenseList = Array.isArray(fundBlob?.expenseList) ? fundBlob.expenseList : [];
    let totalBalance = typeof fundBlob?.totalBalance === 'number' ? fundBlob.totalBalance : 0;
    let totalExpense = typeof fundBlob?.totalExpense === 'number' ? fundBlob.totalExpense : 0;
    const idx = expenseList.findIndex((exp: any) => exp.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    const oldAmount = Number(expenseList[idx].amount);
    // Update expense
    const updatedExpense = { ...expenseList[idx], description, amount: Number(amount) };
    const updatedExpenseList = [...expenseList];
    updatedExpenseList[idx] = updatedExpense;
    // Adjust totalBalance
    totalBalance += oldAmount; // add back old
    totalBalance -= Number(amount); // deduct new
    // Adjust totalExpense
    totalExpense += Number(amount) - oldAmount;
    if (totalExpense < 0) totalExpense = 0;
    await updateTeamFunData({ ...fundBlob, expenseList: updatedExpenseList, totalBalance, totalExpense });
    return NextResponse.json({ success: true, expenseList: updatedExpenseList, totalBalance, totalExpense });
  } catch (error) {
    return NextResponse.json({ error: "Failed to modify expense" }, { status: 500 });
  }
} 