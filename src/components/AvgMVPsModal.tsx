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
            {avgMvpData.sort((a, b) => (b.matchCount * b.avgMvp) - (a.matchCount * a.avgMvp)).map((player) => (
              <div key={player.playerId} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                {/* Top Row: Profile Image and Name */}
                <div className="flex items-center gap-4">
                  <img src={player.profilePhoto} alt={player.playerName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="font-bold text-gray-800">{player.playerName}</div>
                </div>

                {/* Bottom Row: Stats */}
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-center">
                  <div>
                    <div className="font-semibold text-teal-600">{player.avgMvp.toFixed(4)}</div>
                    <div className="text-xs text-gray-500">Avg MVP</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">{player.matchCount}</div>
                    <div className="text-xs text-gray-500">Matches</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-700">{(player.matchCount * player.avgMvp).toFixed(4)}</div>
                    <div className="text-xs text-gray-500">Weightage</div>
                  </div>
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