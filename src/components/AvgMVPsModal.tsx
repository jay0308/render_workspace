import React from "react";

interface AvgMvpPlayer {
  playerId: number;
  playerName: string;
  profilePhoto: string;
  avgMvp: number;
  matchCount: number;
}

interface AvgMVPsModalProps {
  open: boolean;
  onClose: () => void;
  avgMvpData: AvgMvpPlayer[];
}

const AvgMVPsModal: React.FC<AvgMVPsModalProps> = ({ open, onClose, avgMvpData }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-lg sm:rounded-lg shadow-lg mx-2 sm:mx-0 flex flex-col transition-all rounded-t-2xl sm:rounded-lg mt-auto sm:mt-0 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Average MVP Scores</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {avgMvpData.sort((a, b) => {
              if (b.matchCount !== a.matchCount) {
                return b.matchCount - a.matchCount;
              }
              return b.avgMvp - a.avgMvp;
            }).map((player) => (
              <div key={player.playerId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <img src={player.profilePhoto} alt={player.playerName} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{player.playerName}</div>
                  <div className="text-sm text-gray-600">
                    Avg MVP: <span className="font-semibold text-teal-600">{player.avgMvp.toFixed(4)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{player.matchCount}</div>
                  <div className="text-xs text-gray-500">Matches</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvgMVPsModal; 