import React, { useState } from "react";

export interface MVPPlayer {
  player_id: number;
  name: string;
  profile_photo: string;
  total: string;
  avg_enrich_mvp?: number;
  enrich_mvp?: number;
  ratings?: any[];
  avg_rating?: number;
  bowling?: string;
  batting?: string;
  fielding?: string;
}

interface ShowMVPsModalProps {
  open: boolean;
  onClose: () => void;
  mvpList: MVPPlayer[];
  selfProfileId?: string;
  onRate?: (player: MVPPlayer, lastRatings?: Record<string, number>, lastComment?: string) => void;
}

const ShowMVPsModal: React.FC<ShowMVPsModalProps> = ({ open, onClose, mvpList, selfProfileId, onRate }) => {
  const [openDetails, setOpenDetails] = useState<Record<number, boolean>>({});
  if (!open) return null;
  // Sort MVPs by enrich_mvp descending
  const sortedMVPs = [...mvpList].sort((a, b) => (b.enrich_mvp ?? 0) - (a.enrich_mvp ?? 0));

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
            const detailsOpen = openDetails[player.player_id] || false;
            // Extract ratings for details
            let bowling = 0, batting = 0, fielding = 0, avg_rating = player.avg_rating ?? 0;
            // Prefer direct values from player object if available
            if (typeof player.bowling === 'string' && player.bowling !== '') bowling = parseFloat(player.bowling);
            if (typeof player.batting === 'string' && player.batting !== '') batting = parseFloat(player.batting);
            if (typeof player.fielding === 'string' && player.fielding !== '') fielding = parseFloat(player.fielding);
            // If not available, fall back to averaging from ratings
            if ((bowling === 0 || isNaN(bowling)) && Array.isArray(player.ratings) && player.ratings.length > 0) {
              let bowlingSum = 0, count = 0;
              for (const r of player.ratings) {
                if (r.ratings && typeof r.ratings.bowling === 'number') {
                  bowlingSum += r.ratings.bowling;
                  count++;
                }
              }
              if (count > 0) bowling = bowlingSum / count;
            }
            if ((batting === 0 || isNaN(batting)) && Array.isArray(player.ratings) && player.ratings.length > 0) {
              let battingSum = 0, count = 0;
              for (const r of player.ratings) {
                if (r.ratings && typeof r.ratings.batting === 'number') {
                  battingSum += r.ratings.batting;
                  count++;
                }
              }
              if (count > 0) batting = battingSum / count;
            }
            if ((fielding === 0 || isNaN(fielding)) && Array.isArray(player.ratings) && player.ratings.length > 0) {
              let fieldingSum = 0, count = 0;
              for (const r of player.ratings) {
                if (r.ratings && typeof r.ratings.fielding === 'number') {
                  fieldingSum += r.ratings.fielding;
                  count++;
                }
              }
              if (count > 0) fielding = fieldingSum / count;
            }
            return (
              <div key={player.player_id} className="flex flex-col gap-1 p-2 rounded hover:bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <img
                    src={player.profile_photo}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{player.name}</div>
                    <div className="text-xs text-gray-500">Enrich MVP: <span className="font-bold text-teal-700">{player.enrich_mvp?.toFixed(4) ?? "-"}</span></div>
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
                <div className="flex w-full">
                  <button
                    className="text-xs text-teal-700 underline px-2 mt-1"
                    onClick={() => setOpenDetails(prev => ({ ...prev, [player.player_id]: !detailsOpen }))}
                  >
                    {detailsOpen ? "Hide Details" : "Show Details"}
                  </button>
                </div>
                {detailsOpen && (
                  <div className="mt-2 w-full text-xs text-gray-700 bg-gray-50 rounded p-2 border border-gray-200">
                    {(() => {
                      const batVal = (batting * 0.7);
                      const bowlVal = (bowling * 0.7);
                      const fieldVal = (fielding * 0.7);
                      const matchVal = (avg_rating * 0.3);
                      const total = batVal + bowlVal + fieldVal + matchVal;
                      return (
                        <div className="font-semibold">
                          Bat: {batVal.toFixed(2)} + Bowl: {bowlVal.toFixed(2)} + Field: {fieldVal.toFixed(2)} + Match Situation: {matchVal.toFixed(2)} = <span className="text-teal-700">{total.toFixed(2)}</span>
                        </div>
                      );
                    })()}
                  </div>
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