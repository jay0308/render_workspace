import React, { useState } from "react";

interface PaymentsModalProps {
  fund: any;
  allPlayers: any[];
  isAdmin: boolean;
  isFundManager: boolean;
  onClose: () => void;
  onStatusChange: (playerId: string, newStatus: 'paid' | 'unpaid', amount?: number) => void;
  teamConfig: any;
  calculatePenalty: (fund: any, dueDate: string, playerId: string) => number;
}

const PaymentsModal: React.FC<PaymentsModalProps> = ({ fund, allPlayers, isAdmin, isFundManager, onClose, onStatusChange, teamConfig, calculatePenalty }) => {
  const today = new Date();
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-teal-800 mb-4">Player Payments</h2>
          <div className="mb-4 text-gray-700 font-medium">Fund: <span className="font-semibold">{fund.description}</span></div>
          <div className="flex flex-col gap-2">
            {Object.entries(fund.payments).map(([pid, status]) => {
              const player = allPlayers.find((p: any) => String(p.playerId) === String(pid));
              const penalty = calculatePenalty(fund, fund.dueDate, pid);
              const isOverdue = status === 'unpaid' && penalty > 0;
              const totalDue = Number(fund.amount) + penalty;
              return (
                <div key={pid} className={`flex flex-col gap-1 p-2 rounded border border-gray-200 ${isOverdue && status === 'unpaid' ? 'bg-red-100' : 'bg-white'}`}>
                  <div className="flex items-center gap-3">
                    {player?.profileImage && (
                      <img src={player.profileImage} alt={player.playerName} className="w-6 h-6 rounded-full object-cover border" />
                    )}
                    <span className="font-medium text-gray-800 flex-1">{player?.playerName || pid}</span>
                    {(isAdmin || isFundManager) ? (
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={status === 'paid'}
                          onChange={() => {
                            setConfirmDialog({
                              playerId: pid,
                              playerName: player?.playerName || pid,
                              status: status as 'paid' | 'unpaid',
                              amount: Number(fund.amount),
                              penalty,
                              newStatus: status === 'paid' ? 'unpaid' : 'paid',
                            });
                            setInputAmount((Number(fund.amount) + penalty).toString());
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-green-400 transition-all relative">
                          <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${status === 'paid' ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className={`ml-2 text-xs font-semibold ${status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>{status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                      </label>
                    ) : (
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${status === 'paid' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-yellow-100 text-yellow-700 border border-yellow-400'}`}>{status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                    )}
                  </div>
                  {status === 'unpaid' && (
                    <div className="flex items-baseline gap-2 mt-1 ml-9">
                      <span className={`font-bold ${isOverdue ? 'text-red-700' : 'text-orange-700'}`}>Due: ₹{totalDue}</span>
                      {penalty > 0 && (
                        <span className="text-xs font-normal text-red-600">(Penalty: ₹{penalty})</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                  onStatusChange(confirmDialog.playerId, confirmDialog.newStatus, Number(inputAmount));
                  setConfirmDialog(null);
                }}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsModal; 