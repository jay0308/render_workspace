import React from "react";
import { useTeamConfig } from "../contexts/TeamConfigContext";
import { useState } from "react";
import ManageTeamMembersModal from "./ManageTeamMembersModal";

const TeamInfoTab: React.FC = () => {
  const { teamConfig, isLoading, error, setTeamConfig } = useTeamConfig();
  const [modalOpen, setModalOpen] = useState(false);

  // Get current profile id from localStorage
  let profileId: string | null = null;
  if (typeof window !== "undefined") {
    profileId = localStorage.getItem("cricheroes_profile_id");
  }
  const isAdmin = teamConfig && profileId && String(teamConfig.ADMIN_PROFILE_ID) === String(profileId);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Loading team information...</div>
      </div>
    );
  }

  if (error || !teamConfig) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error || "Failed to load team information"}</div>
      </div>
    );
  }

  const { battingOrder, benchmarks, teamRules, additionalInfo } = teamConfig;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">

      {isAdmin && (
              <button
                className="fixed bottom-8 right-8 z-50 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
                title="Manage Team Members"
                onClick={() => setModalOpen(true)}
              >
                +
              </button>
            )}
            <ManageTeamMembersModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              teamConfig={teamConfig}
              setTeamConfig={setTeamConfig}
            />
      {/* Batting Order Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
          <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
            🏏 Current Batting Order
          </h2>
        </div>
        <div className="p-6">
          {battingOrder && battingOrder.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {battingOrder.map((player) => (
                <div 
                  key={player.playerId}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="relative w-10 h-10">
                    {player.profileImage && (
                      <img src={player.profileImage} alt={player.playerName} className="w-10 h-10 rounded-full object-cover border" />
                    )}
                    <div className="absolute bottom-0 left-0 w-6 h-6 bg-teal-700 bg-opacity-70 text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md">
                      {player.battingOrder}
                    </div>
                  </div>
                  <span className="font-medium text-gray-800 text-base ml-2">{player.playerName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No batting order configured
            </div>
          )}
        </div>
      </div>

      {/* Performance Benchmarks Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            📈 Performance Benchmarks
          </h2>
          <p className="text-sm text-blue-600 mt-1">
            Evaluations conducted after every {teamConfig.metadata?.evaluationFrequency || "7-8 innings"}
          </p>
          <p className="text-sm text-orange-600 mt-1">
            {teamConfig?.metadata?.minimumBenchmarkNotes}
          </p>
        </div>
        <div className="p-6">
          {benchmarks && benchmarks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benchmarks.map((benchmark, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{benchmark.icon}</span>
                    <h3 className="font-semibold text-gray-800">{benchmark.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {benchmark.criteria.map((criterion, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No performance benchmarks configured
            </div>
          )}
        </div>
      </div>

      {/* Team Rules Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
            📋 Team Guidelines & Rules
          </h2>
        </div>
        <div className="p-6">
          {teamRules && teamRules.length > 0 ? (
            <div className="space-y-6">
              {teamRules.map((rule, index) => (
                <div key={index} className="border-l-4 border-orange-300 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{rule.icon}</span>
                    <h3 className="font-semibold text-gray-800">{rule.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No team rules configured
            </div>
          )}
        </div>
      </div>

      {/* Important Note */}
      {additionalInfo?.importantNote && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-xl mt-1">{additionalInfo.importantNote.icon}</span>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">{additionalInfo.importantNote.title}</h4>
              <p className="text-yellow-700 text-sm">
                {additionalInfo.importantNote.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamInfoTab; 