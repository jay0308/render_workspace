"use client";
import React, { useState, useEffect } from "react";
import MatchSummaryCard from "../components/MatchSummaryCard";
import AddMatchModal from "@/components/AddMatchModal";
import { ADMIN_PROFILE_ID } from "@/utils/constants";
import { useRouter } from "next/navigation";
import ShowMVPsModal from "../components/ShowMVPsModal";
import { get, post } from "@/utils/request";
import RateMVPModal from "../components/RateMVPModal";
import AwardAnimationModal from "../components/AwardAnimationModal";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMVPsModal, setShowMVPsModal] = useState(false);
  const [selectedMVPs, setSelectedMVPs] = useState<any[]>([]);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [ratePlayer, setRatePlayer] = useState<any>(null);
  const [bestPlayerPerMatch, setBestPlayerPerMatch] = useState<any[]>([]);
  const [bestOverallPlayer, setBestOverallPlayer] = useState<any>(null);
  const [ratePrefill, setRatePrefill] = useState<Record<string, number> | undefined>(undefined);
  const [rateCommentPrefill, setRateCommentPrefill] = useState<string | undefined>(undefined);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for profile ID in localStorage
    const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;
    if (!profileId) {
      router.replace("/login");
      return;
    }
    setIsAdmin(profileId === String(ADMIN_PROFILE_ID));
  }, [router]);

  useEffect(() => {
    const fetchMatches = async () => {
      setFetching(true);
      setFetchError("");
      try {
        const data = await get<{ matches: any[]; bestPlayerPerMatch: any[]; bestOverallPlayer: any }>("/api/get-matches");
        if (Array.isArray(data.matches)) {
          setMatches(data.matches);
        } else {
          setMatches([]);
        }
        setBestPlayerPerMatch(Array.isArray(data.bestPlayerPerMatch) ? data.bestPlayerPerMatch : []);
        setBestOverallPlayer(data.bestOverallPlayer || null);
      } catch (err) {
        setFetchError("Failed to fetch matches");
        setMatches([]);
        setBestPlayerPerMatch([]);
        setBestOverallPlayer(null);
      } finally {
        setFetching(false);
      }
    };
    const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;
    if (profileId) {
      fetchMatches();
    }
  }, []);

  const handleOpen = () => {
    setShowModal(true);
    setUrl("");
    setError("");
  };
  const handleClose = () => setShowModal(false);

  const handleSubmit = async (nextData: string) => {
    setLoading(true);
    setError("");
    try {
      await post("/api/add-match-summary", { matchDataJSONString: nextData });
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;

  // Helper to get month name from last match
  const getLastMatchMonth = () => {
    if (!matches.length) return "";
    const lastMatch = matches[matches.length - 1];
    const dateStr = lastMatch?.matchSummary?.startDateTime;
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full py-4 px-6 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-100">
          Counterstrikers MVP's
        </h1>
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded shadow-sm transition-colors text-sm"
          onClick={() => {
            localStorage.removeItem("cricheroes_profile_id");
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-8">
        {bestOverallPlayer && (
          <div className="w-full max-w-xl mx-auto mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex flex-col sm:flex-row items-center gap-4 shadow">
            <div className="flex flex-row gap-2 w-full items-center">
              <img src={bestOverallPlayer.profile_photo} alt={bestOverallPlayer.name} className="w-12 h-12 rounded-full object-cover border border-yellow-300" />
              <div className="font-bold text-gray-800">{bestOverallPlayer.name}</div>
            </div>

            <div className="flex-1">
              <div className="font-semibold text-yellow-700 text-sm">
                Best Overall Performer of Month {getLastMatchMonth()}
              </div>
              <div className="text-xs text-gray-500">Avg Enrich MVP: <span className="font-bold text-yellow-700">{bestOverallPlayer.avg_enrich_mvp?.toFixed(4)}</span></div>
            </div>
            <div className="w-full flex justify-end">
              {profileId !== String(bestOverallPlayer?.player_id) && (
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded shadow text-xs"
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to award and clear all match data?")) {
                      try {
                        // await post("/api/clear-matches", {});
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
        )}
        {fetching ? (
          <div className="text-gray-500 text-lg py-8">Loading...</div>
        ) : fetchError ? (
          <div className="text-red-500 text-lg py-8">{fetchError}</div>
        ) : matches.length === 0 ? (
          <div className="text-gray-500 text-lg py-8">No match found</div>
        ) : (
          <MatchSummaryCard
            {...matches[matches.length - 1].matchSummary}
            matchSummary={matches[matches.length - 1].matchSummary.matchSummary}
            matchResult={matches[matches.length - 1].matchSummary.matchResult}
            teamA={matches[matches.length - 1].matchSummary.teamA}
            teamB={matches[matches.length - 1].matchSummary.teamB}
            onShowMVPs={() => {
              setSelectedMVPs(matches[matches.length - 1].counterstrikersMVPs || []);
              setShowMVPsModal(true);
            }}
            bestPlayer={bestPlayerPerMatch.length > 0 ? bestPlayerPerMatch[bestPlayerPerMatch.length - 1]?.player : undefined}
          />
        )}
      </main>

      {/* Floating Add Match Button */}
      {isAdmin && (
        <button
          className="fixed bottom-20 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
          onClick={handleOpen}
          title="Add Match"
        >
          +
        </button>
      )}

      <AddMatchModal
        open={showModal}
        url={url}
        error={error}
        onClose={handleClose}
        onChange={setUrl}
        onSubmit={handleSubmit}
        setError={setError}
        loading={loading}
      />

      <ShowMVPsModal
        open={showMVPsModal}
        onClose={() => { setShowMVPsModal(false); window.location.reload() }}
        mvpList={selectedMVPs}
        selfProfileId={profileId || undefined}
        onRate={(player: any, lastRatings: Record<string, number> | undefined, lastComment: string | undefined) => {
          setRatePlayer(player);
          setRatePrefill(lastRatings);
          setRateCommentPrefill(lastComment);
          setRateModalOpen(true);
        }}
      />

      <RateMVPModal
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        player={ratePlayer}
        prefillRatings={ratePrefill}
        prefillComment={rateCommentPrefill}
        onSubmit={async ({ ratings, comment }) => {
          setRateModalOpen(false);
          if (!ratePlayer || matches.length === 0) return;
          const matchId = matches[matches.length - 1].matchId;
          try {
            await post("/api/submit-rating", { ratings, matchId, playerId: ratePlayer.player_id, comment });
            alert("Rating submitted successfully!");
          } catch (err: any) {
            alert(err.message || "Failed to submit rating");
          }
        }}
      />

      <AwardAnimationModal
        open={showAwardModal}
        onClose={() => {
          setShowAwardModal(false);
          window.location.reload();
        }}
        playerName={bestOverallPlayer?.name || ""}
      />

      {/* Footer */}
      <footer className="w-full py-3 px-6 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Counterstrikers MVP's
      </footer>
    </div>
  );
}
