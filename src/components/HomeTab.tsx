import React, { useMemo } from "react";
import MatchSummaryCard from "./MatchSummaryCard";
import { useTeamConfig } from "../contexts/TeamConfigContext";
import { post } from "@/utils/request";

interface HomeTabProps {
  bestOverallPlayer: any;
  fetching: boolean;
  fetchError: string;
  matches: any[];
  bestPlayerPerMatch: any[];
  profileId: string | null;
  setSelectedMVPs: (mvps: any[]) => void;
  setSelectedMatchId: (id: number | null) => void;
  setShowMVPsModal: (show: boolean) => void;
  setShowAwardModal: (show: boolean) => void;
  setRatingSubmitted: (submitted: boolean) => void;
  onShowAvgMvps: () => void;
}

const HomeTab: React.FC<HomeTabProps> = ({
  bestOverallPlayer,
  fetching,
  fetchError,
  matches,
  bestPlayerPerMatch,
  profileId,
  setSelectedMVPs,
  setSelectedMatchId,
  setShowMVPsModal,
  setShowAwardModal,
  setRatingSubmitted,
  onShowAvgMvps,
}) => {
  const { teamConfig } = useTeamConfig();
  
  const lastMatchMonth = useMemo(() => {
    if (!matches.length) {
      return "";
    }
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.matchSummary.startDateTime).getTime() - new Date(a.matchSummary.startDateTime).getTime()
    );
    const mostRecentMatch = sortedMatches[0];
    const dateStr = mostRecentMatch?.matchSummary?.startDateTime;
    if (!dateStr) {
      return "";
    }
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }, [matches]);

  return (
    <>
      {bestOverallPlayer && (
        <div className="w-full max-w-xl mx-auto mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Player Info */}
            <div className="flex flex-row gap-2 w-full items-center">
              <img src={bestOverallPlayer.profile_photo} alt={bestOverallPlayer.name} className="w-12 h-12 rounded-full object-cover border border-yellow-300" />
              <div className="font-bold text-gray-800">{bestOverallPlayer.name}</div>
            </div>

            {/* Performer Details */}
            <div className="flex-1 w-full">
              <div className="font-semibold text-yellow-700 text-sm">
                Best Overall Performer of Month {lastMatchMonth}
              </div>
              <div className="text-xs text-gray-500">Avg Enrich MVP: <span className="font-bold text-yellow-700">{bestOverallPlayer.avg_enrich_mvp?.toFixed(4)}</span></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t border-yellow-100 flex items-center justify-between">
            <div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow text-xs"
                onClick={onShowAvgMvps}
              >
                View Avg MVPs
              </button>
            </div>

            <div>
              {profileId !== String(bestOverallPlayer?.player_id) && 
              (profileId === String(teamConfig?.ADMIN_PROFILE_ID) || teamConfig?.AWARD_NOW_VISIBLITY_PROFILE_ID.includes(Number(profileId))) && (
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded shadow text-xs"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to award and clear all match data?")) {
                      try {
                        await post("/api/clear-matches", {});
                        setShowAwardModal(true);
                      } catch (err: any) {
                        alert(err.message || "Failed to award player");
                      }
                    }
                  }}
                >
                  Award Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {fetching ? (
        <div className="text-gray-500 text-lg py-8">Loading...</div>
      ) : fetchError ? (
        <div className="text-red-500 text-lg py-8">{fetchError}</div>
      ) : matches.length === 0 ? (
        <div className="text-gray-500 text-lg py-8">No match found</div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
          {matches
            .sort((a, b) => new Date(b.matchSummary.startDateTime).getTime() - new Date(a.matchSummary.startDateTime).getTime())
            .map((match, index) => {
              const bestPlayerForThisMatch = bestPlayerPerMatch.find(bp => bp.matchId === match.matchId)?.player;
              return (
                <MatchSummaryCard
                  key={match.matchId}
                  {...match.matchSummary}
                  matchSummary={match.matchSummary.matchSummary}
                  matchResult={match.matchSummary.matchResult}
                  teamA={match.matchSummary.teamA}
                  teamB={match.matchSummary.teamB}
                  tinyShareUrl={match.matchSummary.tinyShareUrl}
                  onShowMVPs={() => {
                    setSelectedMVPs(match.counterstrikersMVPs || []);
                    setSelectedMatchId(match.matchId);
                    setRatingSubmitted(false); // Reset rating submitted state when opening MVP modal
                    setShowMVPsModal(true);
                  }}
                  bestPlayer={bestPlayerForThisMatch}
                />
              );
            })}
        </div>
      )}
    </>
  );
};

export default HomeTab; 