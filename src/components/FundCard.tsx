import React from "react";
import { calculatePenalty } from "../utils/commonUtils";

interface FundCardProps {
  fund: any;
  isAdmin: boolean;
  isFundManager: boolean;
  onPayments: () => void;
  onModify: () => void;
  onDelete: () => void;
  penaltyPerDay: number;
}

const FundCard: React.FC<FundCardProps> = ({ fund, isAdmin, isFundManager, onPayments, onModify, onDelete, penaltyPerDay }) => {
  const allPlayers = fund.allPlayers || [];
  const getWhatsappMessage = React.useCallback(() => {
    let msg = `*${fund.description}*\n`;
    msg += `Amount: ₹${fund.amount}\n`;
    msg += `Due Date: ${fund.dueDate}\n`;
    msg += `\n*Players Payment Status:*\n`;
    if (fund.payments) {
      Object.entries(fund.payments).forEach(([pid, status]: any) => {
        const player = allPlayers.find((p: any) => String(p.playerId) === String(pid));
        const name = player?.playerName || pid;
        if (status === 'paid') {
          msg += `- ${name}: ✅ Paid\n`;
        } else {
          const penalty = calculatePenalty(fund, fund.dueDate, pid, penaltyPerDay);
          if (penalty > 0) {
            msg += `- ${name}: ❌ Unpaid (Penalty: ₹${penalty})\n`;
          } else {
            msg += `- ${name}: ❌ Unpaid\n`;
          }
        }
      });
    }
    return msg;
  }, [fund, allPlayers, penaltyPerDay]);

  const handleWhatsappShare = () => {
    const msg = getWhatsappMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  let currentPlayerId: string | null = null;
  if (typeof window !== "undefined") {
    currentPlayerId = localStorage.getItem("cricheroes_profile_id");
  }
  let cardBg = "bg-white";
  let borderColor = "border-gray-100";
  let showDue = false;
  let playerPenalty = 0;
  let playerTotalDue = 0;
  if (currentPlayerId && fund.payments && fund.payments[currentPlayerId]) {
    const status = fund.payments[currentPlayerId];
    if (status === "paid") {
      cardBg = "bg-green-50";
      borderColor = "border-green-600";
    } else {
      const today = new Date();
      const dueDate = fund.dueDate ? new Date(fund.dueDate) : null;
      if (dueDate && today > dueDate) {
        cardBg = "bg-red-50";
        borderColor = "border-red-600";
      } else {
        cardBg = "bg-orange-50";
        borderColor = "border-orange-500";
      }
      showDue = true;
      playerPenalty = calculatePenalty(fund, fund.dueDate, currentPlayerId, penaltyPerDay);
      playerTotalDue = Number(fund.amount) + playerPenalty;
    }
  }

  return (
    <div className={`rounded-xl shadow-md ${cardBg} p-5 mb-6 border-2 ${borderColor}`}>
      <div className="mb-4">
        <div className="text-xl font-bold text-teal-800">{fund.description}</div>
        {(!isAdmin && !isFundManager && showDue && playerTotalDue > 0) && (
          <div className="text-lg font-bold text-red-600 flex items-center gap-2 mt-1">
            <span>Due: ₹{playerTotalDue}</span>
            {playerPenalty > 0 && <span className="text-base font-normal">(Penalty: ₹{playerPenalty})</span>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-700 font-medium">Amount:</span>
          <span className="font-bold text-green-600 text-lg">₹{fund.amount}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-gray-700 font-medium">Due:</span>
          <span className="text-gray-600">{fund.dueDate}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Created: {fund.createdDate ? new Date(fund.createdDate).toLocaleString() : "-"}
        </div>
      </div>
      {(isAdmin || isFundManager) && (
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition"
            onClick={handleWhatsappShare}
            title="Share on WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.72 13.06a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a.75.75 0 01-.97.32 7.5 7.5 0 01-3.3-3.3.75.75 0 01.32-.97l.5-.3c.2-.13.35-.34.4-.57.05-.23 0-.47-.13-.67a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a1.75 1.75 0 00-.18 1.6c.7 1.7 2.1 3.1 3.8 3.8.2.08.42.06.6-.06l.5-.3c.2-.13.44-.18.67-.13.23.05.44.2.57.4l.3.5c.13.2.18.44.13.67-.05.23-.2.44-.4.57z" /></svg>
            Share
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow transition"
            onClick={onPayments}
          >
            <span>💸</span> Payments
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition"
            onClick={onModify}
          >
            <span>✏️</span> Modify
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-700 bg-white hover:bg-red-50 font-semibold shadow transition"
            onClick={onDelete}
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default FundCard; 