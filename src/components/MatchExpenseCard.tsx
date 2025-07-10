import React from 'react';

const MatchExpenseCard = ({
  expense,
  allPlayers,
  canManageMatchFunds,
  onShowPlayersExpenses,
  onModify,
  onShare,
  onSettleUp
}: {
  expense: any;
  allPlayers: any[];
  canManageMatchFunds: boolean;
  onShowPlayersExpenses: () => void;
  onModify: () => void;
  onShare: () => void;
  onSettleUp: () => void;
}) => {
  return (
    <div className="rounded-xl shadow-md bg-white p-5 mb-6 border border-gray-100">
      <div className="mb-4">
        <div className="text-xl font-bold text-orange-800">{expense.description}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-700 font-medium">Match Fees:</span>
          <span className="font-bold text-orange-600 text-lg">₹{expense.matchFees || expense.amount}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-700 font-medium">Due Date:</span>
          <span className="text-gray-600">{expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '-'}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-700 font-medium">Paid By:</span>
          <span className="text-gray-800 font-semibold">{(() => {
            const player = allPlayers.find((p: any) => p.playerId === expense.paidBy);
            return player ? player.playerName : expense.paidBy || '-';
          })()}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-gray-700 font-medium">Players:</span>
          <span className="flex flex-wrap gap-2">
            {Array.isArray(expense.players) && expense.players.length > 0 ? (
              expense.players.map((pid: string) => {
                const player = allPlayers.find((p: any) => p.playerId === pid);
                return player ? (
                  <span key={pid} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium border border-orange-200">
                    {player.playerName}
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </span>
        </div>
        {expense.playersExpensesDetails && expense.playersExpensesDetails.payerId && (
          <div className="flex items-center gap-2 mt-1 text-sm text-blue-700">
            <span className="font-medium">Food Paid By:</span>
            <span className="font-semibold">{(() => {
              const allParts = [ ...(expense.playersExpensesDetails.participants || []), ...(expense.playersExpensesDetails.tempPlayers || []) ];
              const payer = allParts.find((p: any) => String(p.id) === String(expense.playersExpensesDetails.payerId));
              return payer ? payer.name : expense.playersExpensesDetails.payerId;
            })()} (₹{expense.playersExpensesDetails.paidAmount || 0})</span>
          </div>
        )}
        {canManageMatchFunds && (
          <div className="flex flex-col md:flex-row gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-600 text-orange-700 bg-white hover:bg-orange-50 font-semibold shadow transition" onClick={onShowPlayersExpenses}>
              <span>👥</span> Players
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition" onClick={onModify}>
              <span>✏️</span> Modify
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition" onClick={onShare}>
              <span>🔗</span> Share
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-700 bg-white hover:bg-gray-50 font-semibold shadow transition" onClick={onSettleUp}>
              <span>✅</span> Settled Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchExpenseCard; 