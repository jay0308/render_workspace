"use client";
import React, { useState, useEffect } from "react";
import MatchSummaryCard from "../components/MatchSummaryCard";
import AddMatchModal from "@/components/AddMatchModal";
import { ADMIN_PROFILE_ID } from "@/utils/constants";
import { useRouter } from "next/navigation";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
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
        const res = await fetch("/api/get-matches");
        const data = await res.json();
        if (Array.isArray(data.matches)) {
          setMatches(data.matches);
        } else {
          setMatches([]);
        }
      } catch (err: any) {
        setFetchError("Failed to fetch matches");
        setMatches([]);
      } finally {
        setFetching(false);
      }
    };
    fetchMatches();
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
      const res = await fetch("/api/add-match-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchDataJSONString: nextData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add match summary");
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full py-4 px-6 bg-gray-900 border-b border-gray-800 flex items-center justify-between relative">
        <h1 className="text-lg font-semibold text-gray-100">
          Counterstrikers MVP's
        </h1>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded shadow-sm transition-colors text-sm"
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

      {/* Footer */}
      <footer className="w-full py-3 px-6 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Counterstrikers MVP's
      </footer>
    </div>
  );
}
