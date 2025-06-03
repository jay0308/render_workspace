import React from "react";

export interface MVPPlayer {
  player_id: number;
  name: string;
  profile_photo: string;
  total: string;
  avg_enrich_mvp?: number;
}

interface ShowMVPsModalProps {
  open: boolean;
  onClose: () => void;
  mvpList: MVPPlayer[];
  selfProfileId?: string;
  onRate?: (player: MVPPlayer) => void;
}

const ShowMVPsModal: React.FC<ShowMVPsModalProps> = ({ open, onClose, mvpList, selfProfileId, onRate }) => {
  if (!open) return null;
  // Sort MVPs by avg_enrich_mvp descending
  const sortedMVPs = [...mvpList].sort((a, b) => (b.avg_enrich_mvp ?? 0) - (a.avg_enrich_mvp ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="fixed inset-0 sm:hidden flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0" />
      </div>
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-lg shadow-lg p-6 mx-2 sm:mx-0
          flex flex-col gap-4 transition-all rounded-t-2xl sm:rounded-lg mt-auto sm:mt-0"
        style={{ maxWidth: "100vw", bottom: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Counterstrikers MVP's</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {sortedMVPs.map((player) => (
            <div key={player.player_id} className="flex items-center gap-4 p-2 rounded hover:bg-gray-50">
              <img
                src={player.profile_photo}
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{player.name}</div>
                <div className="text-xs text-gray-500">Avg Enrich MVP: <span className="font-bold text-teal-700">{player.avg_enrich_mvp?.toFixed(4) ?? "-"}</span></div>
              </div>
              {selfProfileId && String(player.player_id) !== selfProfileId && onRate && (
                <button
                  className="ml-2 px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold"
                  onClick={() => onRate(player)}
                >
                  Rate Now
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShowMVPsModal; 