import React from 'react';

const MatchExpenseDueSummary = ({ matchExpenseList, profileId }: { matchExpenseList: any[]; profileId: string }) => {
  let totalUserDue = 0;
  let dueCount = 0;
  if (profileId && matchExpenseList.length > 2) {
    matchExpenseList.forEach(expense => {
      if (expense.playersExpensesDetails && expense.playersExpensesDetails.summary) {
        const userSummary = expense.playersExpensesDetails.summary.find((s: any) => String(s.id) === String(profileId));
        if (userSummary && userSummary.net < 0) {
          totalUserDue += -userSummary.net;
          dueCount++;
        }
      }
    });
  }
  if (dueCount > 1) {
    return (
      <div className="mb-4 flex items-center justify-center w-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl text-lg font-bold flex flex-col items-end gap-0 shadow">
          <span>⚠️ Your Total Due: ₹{totalUserDue.toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default MatchExpenseDueSummary; 