"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Helper to check profile ID
async function checkProfileId(profileId: string): Promise<{ success: boolean; isAdmin?: boolean }> {
  try {
    const res = await fetch("/api/check-profile-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch {
    return { success: false };
  }
}

export default function LoginPage() {
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId.trim() || isNaN(Number(profileId))) {
      setError("Please enter a valid numeric profile ID");
      return;
    }
    setLoading(true);
    setError("");
    const result = await checkProfileId(profileId.trim());
    setLoading(false);
    if (result.success) {
      localStorage.setItem("cricheroes_profile_id", profileId.trim());
      router.push("/");
    } else {
      setError("Not belongs to Counterstrikers team");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-900">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">Cricheroes Profile ID</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
            placeholder="Enter your profile ID"
            value={profileId}
            onChange={e => { setProfileId(e.target.value); setError(""); }}
            required
            disabled={loading}
          />
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            type="submit"
            className="py-2 rounded bg-teal-600 text-white hover:bg-teal-700 font-semibold mt-2 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
} 