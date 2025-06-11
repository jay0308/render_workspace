"use client";
import React, { useState, useEffect } from "react";
import MatchSummaryCard from "../components/MatchSummaryCard";
import AddMatchModal from "@/components/AddMatchModal";

import { useRouter } from "next/navigation";
import ShowMVPsModal from "../components/ShowMVPsModal";
import { get, post } from "@/utils/request";
import RateMVPModal from "../components/RateMVPModal";
import AwardAnimationModal from "../components/AwardAnimationModal";
import HomeTab from "../components/HomeTab";
import TeamStatsTab from "../components/TeamStatsTab";
import TeamInfoTab from "../components/TeamInfoTab";
import SubmitMatchStatsModal from "../components/SubmitMatchStatsModal";
import { TeamConfigProvider, useTeamConfig } from "../contexts/TeamConfigContext";
import { getConfigData } from "@/utils/JSONBlobUtils";

function HomeContent() {
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
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [ratePlayer, setRatePlayer] = useState<any>(null);
  const [bestPlayerPerMatch, setBestPlayerPerMatch] = useState<any[]>([]);
  const [bestOverallPlayer, setBestOverallPlayer] = useState<any>(null);
  const [ratePrefill, setRatePrefill] = useState<Record<string, number> | undefined>(undefined);
  const [rateCommentPrefill, setRateCommentPrefill] = useState<string | undefined>(undefined);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'team-stats' | 'team-info'>('home');
  const [showSubmitMatchStatsModal, setShowSubmitMatchStatsModal] = useState(false);
  const [submitMatchStatsError, setSubmitMatchStatsError] = useState("");
  const [submitMatchStatsLoading, setSubmitMatchStatsLoading] = useState(false);
  const router = useRouter();

  // Use team config context
  const { teamConfig, setTeamConfig, setIsLoading: setTeamConfigLoading, setError: setTeamConfigError, isLoading: teamConfigLoading } = useTeamConfig();

  useEffect(() => {
    // Check for profile ID in localStorage
    const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;
    if (!profileId) {
      router.replace("/login");
      return;
    }
    // Only check admin status if teamConfig is loaded
    if (teamConfig) {
      setIsAdmin(profileId === String(teamConfig.ADMIN_PROFILE_ID));
    }
  }, [router, teamConfig]);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setTeamConfigLoading(true);
      setFetchError("");
      setTeamConfigError(null);

      try {
        // Fetch both MVP data and config data in parallel
        const [matchesData, configData] = await Promise.all([
          get<{ matches: any[]; bestPlayerPerMatch: any[]; bestOverallPlayer: any }>("/api/get-matches"),
          getConfigData()
        ]);

        // Handle matches data
        if (Array.isArray(matchesData.matches)) {
          setMatches(matchesData.matches);
        } else {
          setMatches([]);
        }
        setBestPlayerPerMatch(Array.isArray(matchesData.bestPlayerPerMatch) ? matchesData.bestPlayerPerMatch : []);
        setBestOverallPlayer(matchesData.bestOverallPlayer || null);

        // Handle config data
        setTeamConfig(configData);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        if (err.message?.includes("config") || err.message?.includes("Config")) {
          setTeamConfigError("Failed to load team configuration");
        } else {
          setFetchError("Failed to fetch matches");
          setMatches([]);
          setBestPlayerPerMatch([]);
          setBestOverallPlayer(null);
        }
      } finally {
        setFetching(false);
        setTeamConfigLoading(false);
      }
    };

    const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;
    if (profileId) {
      fetchData();
    }
  }, [setTeamConfig, setTeamConfigLoading, setTeamConfigError]);

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

  const handleSubmitMatchStatsOpen = () => {
    setShowSubmitMatchStatsModal(true);
    setSubmitMatchStatsError("");
  };

  const handleSubmitMatchStatsClose = () => setShowSubmitMatchStatsModal(false);

  const handleSubmitMatchStatsSubmit = async (jsonData: string) => {
    setSubmitMatchStatsLoading(true);
    setSubmitMatchStatsError("");
    try {
      await post("/api/submit-match-stats", { matchStatsJSON: jsonData });
      setShowSubmitMatchStatsModal(false);
      alert("Match statistics submitted successfully!");
      window.location.reload();
    } catch (err: any) {
      setSubmitMatchStatsError(err.message || "Something went wrong");
    } finally {
      setSubmitMatchStatsLoading(false);
    }
  };



  const profileId = typeof window !== "undefined" ? localStorage.getItem("cricheroes_profile_id") : null;

  // Show loading state if either data source is loading
  const isDataLoading = fetching || teamConfigLoading;

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

      {/* Tabs Navigation */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'home'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('home')}
            >
              Home
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team-stats'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('team-stats')}
            >
              Team Stats
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team-info'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('team-info')}
            >
              Team Info
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-8 pb-24 md:pb-8">
        {isDataLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 text-lg">Loading application data...</div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeTab
                bestOverallPlayer={bestOverallPlayer}
                fetching={fetching}
                fetchError={fetchError}
                matches={matches}
                bestPlayerPerMatch={bestPlayerPerMatch}
                profileId={profileId}
                setSelectedMVPs={setSelectedMVPs}
                setSelectedMatchId={setSelectedMatchId}
                setShowMVPsModal={setShowMVPsModal}
                setShowAwardModal={setShowAwardModal}
                setRatingSubmitted={setRatingSubmitted}
              />
            )}

            {activeTab === 'team-stats' && <TeamStatsTab />}
            
            {activeTab === 'team-info' && <TeamInfoTab />}
          </>
        )}
      </main>

      {/* Floating Add Match Button */}
      {isAdmin && activeTab === 'home' && (
        <button
          className="fixed bottom-24 md:bottom-20 right-6 z-40 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
          onClick={handleOpen}
          title="Add Match"
        >
          +
        </button>
      )}

      {/* Floating Submit Match Stats Button */}
      {isAdmin && activeTab === 'team-stats' && (
        <button
          className="fixed bottom-24 md:bottom-20 right-6 z-40 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-2xl transition-all"
          onClick={handleSubmitMatchStatsOpen}
          title="Submit Match Stats"
        >
          🏏
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex">
          <button
            className={`flex-1 px-2 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'home'
                ? 'text-teal-600 bg-teal-50 border-t-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('home')}
          >
            <span className="text-lg">🏠</span>
            <span className="leading-none">Home</span>
          </button>
          <button
            className={`flex-1 px-2 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'team-stats'
                ? 'text-teal-600 bg-teal-50 border-t-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('team-stats')}
          >
            <span className="text-lg">📊</span>
            <span className="leading-none">Team Stats</span>
          </button>
          <button
            className={`flex-1 px-2 py-3 text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === 'team-info'
                ? 'text-teal-600 bg-teal-50 border-t-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('team-info')}
          >
            <span className="text-lg">ℹ️</span>
            <span className="leading-none">Team Info</span>
          </button>
        </div>
      </div>

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
        onClose={() => { 
          setShowMVPsModal(false); 
          if (ratingSubmitted) {
            window.location.reload();
          }
        }}
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
          if (!ratePlayer || !selectedMatchId) return;
          try {
            await post("/api/submit-rating", { ratings, matchId: selectedMatchId, playerId: ratePlayer.player_id, comment });
            setRatingSubmitted(true); // Mark that rating was submitted
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

      <SubmitMatchStatsModal
        open={showSubmitMatchStatsModal}
        onClose={handleSubmitMatchStatsClose}
        onSubmit={handleSubmitMatchStatsSubmit}
        loading={submitMatchStatsLoading}
        error={submitMatchStatsError}
        setError={setSubmitMatchStatsError}
      />

      {/* Footer */}
      <footer className="w-full py-3 px-6 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 md:block hidden">
        &copy; {new Date().getFullYear()} Counterstrikers MVP's
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <TeamConfigProvider>
      <HomeContent />
    </TeamConfigProvider>
  );
}
