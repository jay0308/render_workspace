import React, { useState } from "react";
import { calculatePenalty } from "../utils/commonUtils";

interface PlayerPaymentsModalProps {
  playerPayments: { playerId: string; playerName: string; profileImage?: string; due: number; fundIds: string[] }[];
  funds: any[];
  penaltyPerDay: number;
  isAdmin: boolean;
  isFundManager: boolean;
  onClose: () => void;
  onMarkAllPaid: (playerId: string, fundIds: string[], amounts: Record<string, number>) => void;
  onMarkAllUnpaid: (playerId: string, fundIds: string[], amounts: Record<string, number>) => void;
  loading: boolean;
}

const PlayerPaymentsModal: React.FC<PlayerPaymentsModalProps> = ({
  playerPayments,
  funds,
  penaltyPerDay,
  isAdmin,
  isFundManager,
  onClose,
  onMarkAllPaid,
  onMarkAllUnpaid,
  loading
}) => {
  let totalPenalty = 0;
  for (const fund of funds) {
    if (fund.payments) {
      Object.entries(fund.payments).forEach(([pid, status]: any) => {
        if (status === 'unpaid') {
          const penalty = calculatePenalty(fund, fund.dueDate, pid, penaltyPerDay);
          totalPenalty += penalty;
        }
      });
    }
  }

  const [confirmDialog, setConfirmDialog] = useState<null | {
    playerId: string;
    playerName: string;
    status: 'paid' | 'unpaid';
    amount: number;
    penalty: number;
    newStatus: 'paid' | 'unpaid';
  }>(null);
  const [inputAmount, setInputAmount] = useState<string>("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-orange-800 mb-4">Player Due Payments</h2>
          {(isAdmin || isFundManager) && totalPenalty > 0 && (
            <div className="mb-6 flex items-center justify-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl text-lg font-bold flex items-center gap-2 shadow">
                <span>⚠️ Total Penalty:</span> <span>₹{totalPenalty}</span>
              </div>
            </div>
          )}
          {playerPayments.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No dues for any player!</div>
          ) : (
            <div className="space-y-3">
              {playerPayments.map(player => {
                let playerPenalty = 0;
                for (const fund of funds) {
                  if (fund.payments && fund.payments[player.playerId] === 'unpaid') {
                    playerPenalty += calculatePenalty(fund, fund.dueDate, player.playerId, penaltyPerDay);
                  }
                }
                return (
                  <div key={player.playerId} className="flex flex-col gap-1 p-3 border rounded bg-orange-50">
                    <div className="flex items-center gap-4">
                      {player.profileImage && (
                        <img src={player.profileImage} alt={player.playerName} className="w-8 h-8 rounded-full object-cover border" />
                      )}
                      <span className="font-semibold text-gray-800 flex-1">{player.playerName}</span>
                      <label className="inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={player.due === 0}
                          disabled={loading}
                          onChange={() => {
                            setConfirmDialog({
                              playerId: player.playerId,
                              playerName: player.playerName,
                              status: player.due === 0 ? 'paid' : 'unpaid',
                              amount: player.due,
                              penalty: playerPenalty,
                              newStatus: player.due === 0 ? 'unpaid' : 'paid',
                            });
                            setInputAmount((player.due + playerPenalty).toString());
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-green-400 transition-all relative">
                          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${player.due === 0 ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className={`ml-2 text-xs font-semibold ${player.due === 0 ? 'text-green-700' : 'text-yellow-700'}`}>{player.due === 0 ? 'All Paid' : 'Due'}</span>
                      </label>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1 ml-12">
                      <span className="font-bold text-orange-700 text-lg">Due: ₹{player.due + playerPenalty}</span>
                      {(isAdmin || isFundManager) && playerPenalty > 0 && (
                        <span className="text-xs font-normal text-red-600">(Penalty: ₹{playerPenalty})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-99">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xs flex flex-col gap-4">
            <div className="text-lg font-bold text-gray-800 mb-2">Amount to be updated</div>
            <div className="text-sm text-gray-700 mb-1">Player: <span className="font-semibold">{confirmDialog.playerName}</span></div>
            <div className="flex flex-col gap-1 mb-2">
              <label className="text-sm font-medium text-gray-700">Amount (including penalty if any):</label>
              <input
                type="number"
                className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
                value={inputAmount}
                onChange={e => setInputAmount(e.target.value)}
                min={0}
              />
              {confirmDialog.penalty > 0 && (
                <span className="text-xs text-red-600">Penalty: ₹{confirmDialog.penalty}</span>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setConfirmDialog(null)}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
                onClick={() => {
                  // Build amounts object for all funds for this player
                  const fundIds = playerPayments.find(p => p.playerId === confirmDialog.playerId)?.fundIds || [];
                  const amounts: Record<string, number> = {};
                  for (const fund of funds) {
                    if (fundIds.includes(fund.id)) {
                      // Calculate penalty for this fund/player
                      const penalty = calculatePenalty(fund, fund.dueDate, confirmDialog.playerId, penaltyPerDay);
                      amounts[fund.id] = (Number(fund.amount) || 0) + penalty;
                    }
                  }
                  if (confirmDialog.newStatus === 'paid') {
                    onMarkAllPaid(confirmDialog.playerId, fundIds, amounts);
                  } else {
                    onMarkAllUnpaid(confirmDialog.playerId, fundIds, amounts);
                  }
                  setConfirmDialog(null);
                }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerPaymentsModal 