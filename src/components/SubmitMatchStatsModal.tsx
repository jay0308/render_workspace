import React, { useState } from "react";

interface SubmitMatchStatsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (jsonData: string) => void;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
}

const SubmitMatchStatsModal: React.FC<SubmitMatchStatsModalProps> = ({
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
      setError("Please enter match statistics JSON data");
      return;
    }

    try {
      // Validate JSON structure
      const parsedData = JSON.parse(jsonInput);
      
      // Basic validation to ensure it has the expected structure
      if (!parsedData?.props?.pageProps?.scorecard || !parsedData?.props?.pageProps?.summaryData) {
        setError("Invalid match data structure. Please ensure the JSON contains scorecard and summaryData.");
        return;
      }

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
  "props": {
    "pageProps": {
      "scorecard": [
        {
          "team_id": 1707850,
          "teamName": "CounterStrikers",
          "inning": {
            "team_id": 1707850,
            "inning": 2,
            "total_run": 213,
            "total_wicket": 6,
            "summary": {
              "score": "213/6",
              "over": "(20.0 Ov)",
              "rr": "10.65"
            }
          },
          "batting": [
            {
              "player_id": 7689720,
              "name": "Chetan",
              "runs": 64,
              "balls": 34,
              "4s": 6,
              "6s": 4,
              "SR": "188.24",
              "how_to_out_short_name": "c Noor Sheikh b S Thakur"
            }
          ],
          "bowling": [
            {
              "player_id": 4946046,
              "name": "Hemant Kumar",
              "overs": 4,
              "balls": 0,
              "runs": 45,
              "wickets": 0,
              "wide": 2,
              "noball": 0,
              "0s": 11,
              "economy_rate": "11.25"
            }
          ]
        }
      ],
      "summaryData": {
        "status": true,
        "data": {
          "match_id": 17678278,
          "match_type": "Limited Overs",
          "overs": 20,
          "ground_name": "Cricket Ground",
          "city_name": "Mumbai",
          "start_datetime": "2025-06-08T11:55:00.000Z",
          "tournament_name": "Tournament Name",
          "tournament_round_name": "League Matches",
          "toss_details": "CounterStrikers opt to bat",
          "team_a": {
            "id": 1026673,
            "name": "Opponent Team",
            "summary": "244/6"
          },
          "team_b": {
            "id": 1707850,
            "name": "CounterStrikers",
            "summary": "213/6"
          },
          "match_summary": {
            "summary": "Opponent Team won by 31 runs"
          },
          "win_by": "31 runs",
          "winning_team": "Opponent Team"
        }
      }
    }
  }
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
        className="relative bg-white w-full sm:max-w-4xl sm:rounded-lg shadow-lg mx-2 sm:mx-0
          flex flex-col transition-all rounded-t-2xl sm:rounded-lg mt-auto sm:mt-0 max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Submit Match Statistics</h2>
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
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📝 Instructions:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Paste the complete JSON data from the match scorecard page</li>
                <li>• Ensure the JSON contains both scorecard and summaryData sections</li>
                <li>• The system will automatically extract CounterStrikers team data</li>
                <li>• Individual batting and bowling performances will be stored</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Statistics JSON
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste the complete match JSON data here..."
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
              <h3 className="text-sm font-medium text-gray-700 mb-2">Example JSON Structure (truncated):</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto max-h-40">
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
            {loading ? "Submitting..." : "Submit Match Stats"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitMatchStatsModal; 