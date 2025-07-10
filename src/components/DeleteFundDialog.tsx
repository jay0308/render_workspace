import React from 'react';

interface DeleteFundDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fund: any;
  amounts: Record<string, number>;
  allPlayers: any[];
  setAmounts: (amounts: Record<string, number>) => void;
}

const DeleteFundDialog: React.FC<DeleteFundDialogProps> = ({ open, onClose, onConfirm, fund, amounts, allPlayers, setAmounts }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-99">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md flex flex-col gap-4">
        <div className="text-lg font-bold text-gray-800 mb-2">Delete Fund</div>
        <div className="text-sm text-gray-700 mb-1">Are you sure you want to delete <span className="font-semibold">{fund.description}</span>?</div>
        <div className="text-sm text-gray-700 mb-2">Enter the amount to deduct for each player who paid:</div>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          {Object.entries(amounts).map(([pid, amt]: [string, number]) => {
            const player = allPlayers.find((p: any) => String(p.playerId) === String(pid));
            return (
              <div key={pid} className="flex items-center gap-2">
                {player?.profileImage && (
                  <img src={player.profileImage} alt={player.playerName} className="w-6 h-6 rounded-full object-cover border" />
                )}
                <span className="font-medium text-gray-800 flex-1">{player?.playerName || pid}</span>
                <input
                  type="number"
                  className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-24"
                  value={amounts[pid]}
                  min={0}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setAmounts({ ...amounts, [pid]: val });
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >Cancel</button>
          <button
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
            onClick={onConfirm}
          >Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFundDialog; 