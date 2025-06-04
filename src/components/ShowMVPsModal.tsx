import React from "react";

export interface MVPPlayer {
  player_id: number;
  name: string;
  profile_photo: string;
  total: string;
  avg_enrich_mvp?: number;
  ratings?: any[];
}

interface ShowMVPsModalProps {
  open: boolean;
  onClose: () => void;
  mvpList: MVPPlayer[];
  selfProfileId?: string;
  onRate?: (player: MVPPlayer, lastRatings?: Record<string, number>, lastComment?: string) => void;
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
          {sortedMVPs.map((player) => {
            let alreadyRated = false;
            let lastRatings: Record<string, number> | undefined = undefined;
            let lastComment: string | undefined = undefined;
            let isSelfMVP = false;
            let isUserMVP = false;
            if (selfProfileId && Array.isArray(player.ratings)) {
              const found = player.ratings.find((r: any) => String(r.raterId) === String(selfProfileId));
              if (found) {
                alreadyRated = true;
                if (typeof found.ratings === 'object') {
                  lastRatings = found.ratings;
                }
                if (typeof found.comment === 'string') {
                  lastComment = found.comment;
                }
              }
            }
            // Check if the logged-in user is an MVP in this match
            if (selfProfileId && Array.isArray(mvpList)) {
              isUserMVP = mvpList.some((mvp) => String(mvp.player_id) === String(selfProfileId));
            }
            isSelfMVP = String(player.player_id) === String(selfProfileId);
            return (
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
                {isUserMVP && !isSelfMVP && onRate && (
                  <button
                    className={`ml-2 px-3 py-1 rounded text-white text-xs font-semibold ${
                      alreadyRated 
                        ? "bg-orange-500 hover:bg-orange-600" 
                        : "bg-teal-600 hover:bg-teal-700"
                    }`}
                    onClick={() => onRate(player, lastRatings, lastComment)}
                  >
                    {alreadyRated ? "Rate Again" : "Rate Now"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShowMVPsModal; 