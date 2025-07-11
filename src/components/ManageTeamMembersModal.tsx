import React, { useState } from "react";
import { post } from "../utils/request";
import { useTeamConfig } from "../contexts/TeamConfigContext";

interface Member {
  playerName: string;
  playerId: string;
  profileImage?: string;
}

interface ManageTeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamConfig: any;
  setTeamConfig: (config: any) => void;
}

const ManageTeamMembersModal: React.FC<ManageTeamMembersModalProps> = ({
  isOpen,
  onClose,
  teamConfig,
  setTeamConfig,
}) => {
  const [jsonInput, setJsonInput] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setJsonInput("");
      setMembers([]);
      setParsingError(null);
      // Prefill activeIds from config
      if (teamConfig && teamConfig.teamMembers) {
        setActiveIds(
          teamConfig.teamMembers.filter((m: any) => m.isActive).map((m: any) => String(m.playerId))
        );
      } else {
        setActiveIds([]);
      }
    }
  }, [isOpen, teamConfig]);

  // Parse JSON and extract members
  const handleParseJson = () => {
    setParsingError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      let membersArr = null;
      if (parsed?.props?.pageProps?.members?.data?.members) {
        membersArr = parsed.props.pageProps.members.data.members;
      } else if (parsed.members) {
        membersArr = parsed.members;
      } else {
        throw new Error("Could not find members array in JSON");
      }
      const mapped = membersArr.map((m: any) => ({
        playerName: m.name || m.playerName || "",
        playerId: String(m.player_id || m.playerId || m.id),
        profileImage: m.profile_photo || m.profileImage || m.profilePhoto || "",
      }));
      setMembers(mapped);
      // Set activeIds from config if present
      if (teamConfig && teamConfig.teamMembers) {
        setActiveIds(
          mapped
            .filter((m: any) =>
              teamConfig.teamMembers.some(
                (tm: any) => String(tm.playerId) === String(m.playerId) && tm.isActive
              )
            )
            .map((m: any) => m.playerId)
        );
      } else {
        setActiveIds([]);
      }
    } catch (e: any) {
      setParsingError(e.message || "Invalid JSON");
      setMembers([]);
    }
  };

  // Toggle active state
  const handleToggleActive = (playerId: string) => {
    setActiveIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Save active members to config
  const handleSave = async () => {
    if (!teamConfig) return;
    setSaving(true);
    try {
      let newTeamMembers: any[] = [];
      if (members.length > 0) {
        newTeamMembers = members.map((m) => ({
          playerName: m.playerName,
          playerId: m.playerId,
          profileImage: m.profileImage,
          isActive: activeIds.includes(m.playerId),
        }));
      } else if (teamConfig.teamMembers) {
        newTeamMembers = teamConfig.teamMembers.map((m: any) => ({
          ...m,
          isActive: activeIds.includes(String(m.playerId)),
        }));
      }
      const updatedConfig = {
        ...teamConfig,
        teamMembers: newTeamMembers,
      };
      await post("/api/update-team-config", updatedConfig);
      setTeamConfig(updatedConfig);
      onClose();
    } catch (e: any) {
      alert(e.message || "Failed to update team members");
    } finally {
      setSaving(false);
    }
  };

  // Determine which list to show: parsed members or context data
  const showMembers = members.length > 0 ? members : (teamConfig?.teamMembers || []);
  const showCount = showMembers.length;
  const filteredMembers = showMembers.filter((m: any) => m.playerName.toLowerCase().includes(search.toLowerCase()));

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aActive = activeIds.includes(a.playerId);
    const bActive = activeIds.includes(b.playerId);
    if (aActive === bActive) return 0;
    return aActive ? -1 : 1;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-teal-50 px-6 py-4 border-b border-teal-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-teal-800">Manage Team Members</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-150px)]">
          <label className="block mb-2 font-medium text-gray-700">Paste JSON string containing members:</label>
          <textarea
            className="w-full border border-gray-300 rounded p-2 mb-2 font-mono text-sm text-gray-900 bg-white"
            rows={5}
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              if (e.target.value === "") {
                setMembers([]); // revert to context data
                setParsingError(null);
              }
            }}
            placeholder="Paste JSON here..."
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
            onClick={handleParseJson}
            type="button"
          >
            Parse
          </button>
          {parsingError && <div className="text-red-500 mb-2">{parsingError}</div>}
          {showMembers.length > 0 && (
            <div>
              <div className="mb-2 font-semibold text-gray-800">Select Active Players:</div>
              <div className="mb-2 text-sm text-gray-700">Selected: {activeIds.length} of {showCount}</div>
              <input
                className="mb-2 p-2 border border-gray-300 rounded text-gray-900 bg-white"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search players..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sortedMembers.map((m: any) => {
                  const selected = activeIds.includes(m.playerId);
                  return (
                    <label
                      key={m.playerId}
                      className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-all select-none 
                        ${selected ? 'bg-green-100 border-green-500 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300'}
                      `}
                      onClick={() => handleToggleActive(m.playerId)}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleToggleActive(m.playerId); }}
                      role="checkbox"
                      aria-checked={selected}
                    >
                      {/* Custom Checkbox Indicator */}
                      <span
                        className={`w-5 h-5 flex items-center justify-center border-2 rounded-full mr-1 transition-colors
                          ${selected ? 'border-green-600 bg-green-500' : 'border-gray-400 bg-white'}`}
                        aria-hidden="true"
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {m.profileImage && (
                        <img src={m.profileImage} alt={m.playerName} className="w-8 h-8 rounded-full object-cover border" />
                      )}
                      <span className="font-medium text-gray-900">{m.playerName || "No Name"}</span>
                      <span className="text-xs text-gray-500">({m.playerId})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-gray-50">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold transition-colors
              ${saving || showMembers.length === 0
                ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
            onClick={handleSave}
            disabled={saving || showMembers.length === 0}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageTeamMembersModal;
