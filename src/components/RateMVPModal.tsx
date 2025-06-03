import React, { useState, useEffect } from "react";
import { ContextualFactors } from "@/utils/constants";
import type { MVPPlayer } from "./ShowMVPsModal";

interface RateMVPModalProps {
  open: boolean;
  onClose: () => void;
  player: MVPPlayer | null;
  onSubmit: (ratings: Record<string, number>) => void;
}

const StarRating: React.FC<{
  value: number;
  onChange: (val: number) => void;
  max?: number;
}> = ({ value, onChange, max = 10 }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
      <button
        key={star}
        type="button"
        className={
          star <= value
            ? "text-yellow-400"
            : "text-gray-300"
        }
        onClick={() => onChange(star)}
        aria-label={`Rate ${star}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
          className="w-5 h-5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      </button>
    ))}
  </div>
);

const RateMVPModal: React.FC<RateMVPModalProps> = ({ open, onClose, player, onSubmit }) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [showDesc, setShowDesc] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !player) {
      setRatings({});
      setShowDesc(null);
    }
  }, [open, player]);

  if (!open || !player) return null;

  const handleRatingChange = (factorKey: string, value: number) => {
    setRatings((prev) => ({ ...prev, [factorKey]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(ratings);
    setRatings({});
    setShowDesc(null);
  };

  const isAnyFilled = Object.values(ratings).some(val => val > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="fixed inset-0 sm:hidden flex items-end justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0" />
      </div>
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-lg shadow-lg p-6 mx-2 sm:mx-0 flex flex-col gap-4 transition-all rounded-t-2xl sm:rounded-lg mt-auto sm:mt-0"
        style={{ maxWidth: "100vw", bottom: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Rate {player.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <img src={player.profile_photo} alt={player.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
          <div className="font-semibold text-gray-800 text-lg">{player.name}</div>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {Object.entries(ContextualFactors).map(([key, factor]) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{factor.name}</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700 text-xs"
                  onClick={() => setShowDesc(showDesc === key ? null : key)}
                  aria-label="Show description"
                >
                  <span className="inline-block w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">i</span>
                </button>
              </div>
              {showDesc === key && (
                <div className="text-xs text-gray-500 mb-1">{factor.description}</div>
              )}
              <StarRating
                value={ratings[key] || 0}
                onChange={val => handleRatingChange(key, val)}
                max={10}
              />
            </div>
          ))}
          <button
            type="submit"
            className="mt-2 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!isAnyFilled}
          >
            Submit Rating
          </button>
        </form>
      </div>
    </div>
  );
};

export default RateMVPModal; 