import React, { useState } from "react";

interface AddMatchStatModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (jsonData: string) => void;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
}

const AddMatchStatModal: React.FC<AddMatchStatModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  setError,
}) => {
  const [jsonInput, setJsonInput] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!jsonInput.trim()) {
      setError("Please enter match stat JSON data");
      return;
    }

    try {
      JSON.parse(jsonInput);
      onSubmit(jsonInput);
    } catch (e) {
      setError("Invalid JSON format. Please check your input.");
    }
  };

  const handleClose = () => {
    setJsonInput("");
    setError("");
    onClose();
  };

  const exampleJson = `{
  "matches": [
    {
      "matchId": "match_001",
      "matchDate": "2024-01-15",
      "opponent": "Team Alpha",
      "result": "Won",
      "totalRuns": 165,
      "totalWickets": 4,
      "overs": "20"
    }
  ],
  "battingStats": [
    {
      "playerId": "rahul_001",
      "playerName": "Rahul",
      "matches": 10,
      "runs": 245,
      "average": 24.5,
      "strikeRate": 125.6,
      "highestScore": 45
    }
  ],
  "bowlingStats": [
    {
      "playerId": "deepak_010",
      "playerName": "Deepak",
      "matches": 8,
      "wickets": 12,
      "economyRate": 8.5,
      "bestFigures": "3/15",
      "overs": 24
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="fixed inset-0 sm:hidden flex items-end justify-center"
        onClick={handleClose}
      >
        <div className="absolute inset-0" />
      </div>
      <div
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-lg shadow-lg mx-2 sm:mx-0
          flex flex-col transition-all rounded-t-2xl sm:rounded-lg mt-auto sm:mt-0 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Match Statistics</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700 text-xl"
            disabled={loading}
          >
            &times;
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Statistics JSON
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Enter match statistics in JSON format..."
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none font-mono text-sm text-gray-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Example JSON Structure:</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {exampleJson}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !jsonInput.trim()}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {loading ? "Adding..." : "Add Statistics"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMatchStatModal; 