import React from "react";

type Team = {
  name: string;
  summary: string;
  innings: { overs_played: string }[];
};

type MatchSummaryCardProps = {
  groundName: string;
  cityName: string;
  matchType: string;
  overs: number;
  startDateTime: string;
  tossDetails: string;
  teamA: Team;
  teamB: Team;
  matchSummary: string;
  matchResult: string;
};

const MatchSummaryCard: React.FC<MatchSummaryCardProps> = ({
  groundName,
  cityName,
  matchType,
  overs,
  startDateTime,
  tossDetails,
  teamA,
  teamB,
  matchSummary,
  matchResult,
}) => {
  return (
    <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-4 sm:p-6 mt-0">
      <div className="text-xs sm:text-sm text-teal-700 font-medium mb-1">
        {groundName}, {cityName}, {matchType}, <span className="font-bold">{overs} Ov.</span>, {startDateTime}
        <span className="inline-block align-middle ml-2 text-red-500" role="img" aria-label="cricket">🏏</span>
      </div>
      <div className="text-gray-600 text-xs sm:text-sm mb-4">{tossDetails}</div>

      <div className="flex flex-col gap-3 sm:gap-4 mb-4">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0">
          <span className="font-bold text-base sm:text-lg text-gray-800">{teamA.name.toUpperCase()}</span>
          <span className="font-extrabold text-xl sm:text-2xl text-black">{teamA.summary} <span className="text-gray-500 text-sm sm:text-base font-normal">({teamA.innings[0].overs_played} Ov)</span></span>
        </div>
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0">
          <span className="font-bold text-base sm:text-lg text-gray-800">{teamB.name.toUpperCase()}</span>
          <span className="font-extrabold text-xl sm:text-2xl text-black">{teamB.summary} <span className="text-gray-500 text-sm sm:text-base font-normal">({teamB.innings[0].overs_played} Ov)</span></span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
        <div className="text-base sm:text-lg font-semibold text-gray-800">
          {matchSummary}
        </div>
        {matchResult === "past" && (
          <span className="text-xs text-gray-900 bg-red-400 rounded-full px-2 py-0.5 w-fit">PAST</span>
        )}
      </div>
    </div>
  );
};

export default MatchSummaryCard; 