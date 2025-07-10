import React, { useState, useEffect } from "react";

interface Player {
  playerId: string;
  playerName: string;
  profileImage?: string;
  isActive?: boolean;
}

interface AddMatchExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: Player[];
  onSave: (data: {
    description: string;
    matchFees: number;
    dueDate: string;
    players: string[];
    paidBy: string;
  }) => void;
  initialData?: {
    description: string;
    matchFees: number;
    dueDate: string;
    players: string[];
    paidBy: string;
  } | null;
}

const AddMatchExpenseModal: React.FC<AddMatchExpenseModalProps> = ({ isOpen, onClose, allPlayers, onSave, initialData }) => {
  const [description, setDescription] = useState("");
  const [matchFees, setMatchFees] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState("");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<{ description?: string; matchFees?: string; players?: string; paidBy?: string; dueDate?: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description || "");
        setMatchFees(initialData.matchFees ? String(initialData.matchFees) : "");
        setDueDate(initialData.dueDate || "");
        setSelectedPlayers(Array.isArray(initialData.players) ? initialData.players : []);
        setPaidBy(initialData.paidBy || "");
      } else {
        setDescription("");
        setMatchFees("");
        setDueDate("");
        // Preselect all active players
        setSelectedPlayers(allPlayers.filter((p: any) => p.isActive).map((p: any) => p.playerId));
        setPaidBy("");
      }
      setErrors({});
    }
  }, [isOpen, initialData, allPlayers]);

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
    // If paidBy is not in new list, clear it
    if (paidBy && !selectedPlayers.includes(paidBy) && paidBy !== playerId) {
      setPaidBy("");
    }
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!description.trim()) newErrors.description = "Description is required";
    if (!matchFees || isNaN(Number(matchFees)) || Number(matchFees) <= 0) newErrors.matchFees = "Enter a valid match fee";
    if (!dueDate) newErrors.dueDate = "Due date is required";
    if (selectedPlayers.length === 0) newErrors.players = "Select at least one player";
    if (!paidBy) newErrors.paidBy = "Select who paid";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    onSave({
      description: description.trim(),
      matchFees: Number(matchFees),
      dueDate,
      players: selectedPlayers,
      paidBy,
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredPlayers = allPlayers
    .filter((p) => p.playerName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aSelected = selectedPlayers.includes(a.playerId);
      const bSelected = selectedPlayers.includes(b.playerId);
      if (aSelected === bSelected) return a.playerName.localeCompare(b.playerName);
      return aSelected ? -1 : 1;
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-orange-800 mb-4">Add Match Expense</h2>
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700 block">Description</label>
            <input
              className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this expense for?"
            />
            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
          </div>
          <div className="mb-4 flex flex-col md:flex-row md:gap-4">
            <div className="flex-1 mb-2 md:mb-0">
              <label className="mb-1 font-medium text-gray-700 block">Match Fees (₹)</label>
              <input
                className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
                type="number"
                min="1"
                value={matchFees}
                onChange={e => setMatchFees(e.target.value)}
                placeholder="Enter match fees"
              />
              {errors.matchFees && <div className="text-red-500 text-sm mt-1">{errors.matchFees}</div>}
            </div>
            <div className="flex-1">
              <label className="mb-1 font-medium text-gray-700 block">Due Date</label>
              <input
                className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
              {errors.dueDate && <div className="text-red-500 text-sm mt-1">{errors.dueDate}</div>}
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700 block">Select Players</label>
            <div className="mb-1 text-sm text-gray-700">Selected: {selectedPlayers.length} of {allPlayers.length}</div>
            <input
              className="mb-2 p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search players..."
            />
            <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
              {filteredPlayers.length === 0 && <div className="text-gray-400 text-sm">No players found.</div>}
              {filteredPlayers.map((player) => {
                const selected = selectedPlayers.includes(player.playerId);
                return (
                  <label
                    key={player.playerId}
                    className={`flex items-center gap-3 p-2 border rounded cursor-pointer transition-all select-none mb-1
                      ${selected ? 'bg-orange-100 border-orange-500 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300'}
                    `}
                    onClick={() => handlePlayerToggle(player.playerId)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handlePlayerToggle(player.playerId); }}
                    role="checkbox"
                    aria-checked={selected}
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center border-2 rounded-full mr-1 transition-colors
                        ${selected ? 'border-orange-600 bg-orange-500' : 'border-gray-400 bg-white'}`}
                      aria-hidden="true"
                    >
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {player.profileImage && (
                      <img src={player.profileImage} alt={player.playerName} className="w-6 h-6 rounded-full object-cover border" />
                    )}
                    <span className="text-gray-800 font-medium">{player.playerName}</span>
                  </label>
                );
              })}
            </div>
            {errors.players && <div className="text-red-500 text-sm mt-1">{errors.players}</div>}
          </div>
          <div className="mb-4">
            <label className="mb-1 font-medium text-gray-700 block">Paid By</label>
            <select
              className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
            >
              <option value="">Select player</option>
              {selectedPlayers.map(pid => {
                const player = allPlayers.find(p => p.playerId === pid);
                return player ? (
                  <option key={pid} value={pid}>{player.playerName}</option>
                ) : null;
              })}
            </select>
            {errors.paidBy && <div className="text-red-500 text-sm mt-1">{errors.paidBy}</div>}
          </div>
        </div>
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMatchExpenseModal; 