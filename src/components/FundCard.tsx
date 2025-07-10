import React from "react";
import { calculatePenalty } from "../utils/commonUtils";
import { post, get } from '../utils/request';

interface FundCardProps {
  fund: any;
  isAdmin: boolean;
  isFundManager: boolean;
  onPayments: () => void;
  onModify: () => void;
  onDelete: () => void;
  penaltyPerDay: number;
  setFunds: (funds: any[]) => void; // Added setFunds prop
}

const FundCard: React.FC<FundCardProps> = ({ fund, isAdmin, isFundManager, onPayments, onModify, onDelete, penaltyPerDay, setFunds }) => {
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

  const [loading, setLoading] = React.useState(false);

  const handleSettleUpFund = async () => {
    if (!window.confirm('Are you sure you want to settle up this fund?')) return;
    setLoading(true);
    try {
      const data: { success?: boolean } = await post('/api/delete-fund', { id: fund.id, skipBalance: true });
      if (data && data.success) {
        // Refetch funds after success
        const resp: { fundList?: any[] } = await get('/api/get-funds');
        if (resp && Array.isArray(resp.fundList) && typeof setFunds === 'function') {
          setFunds(resp.fundList);
        }
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('fundSettledUp'));
        }
      }
    } catch (e) {
      alert('Failed to settle up fund');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition"
            onClick={handleWhatsappShare}
            title="Share on WhatsApp"
          >
            <span>📞</span> Share
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow transition"
            onClick={onPayments}
            title="Payments"
          >
            <span>💸</span> Payments
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition"
            onClick={onModify}
            title="Modify"
          >
            <span>✏️</span> Modify
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-700 bg-white hover:bg-red-50 font-semibold shadow transition"
            onClick={onDelete}
            title="Delete"
          >
            <span>🗑️</span> Delete
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-700 bg-white hover:bg-gray-50 font-semibold shadow transition col-span-2"
            onClick={handleSettleUpFund}
            title="Settle Up Fund (does not affect total balance)"
            disabled={loading}
          >
            {loading ? <span className="animate-spin">⏳</span> : <span>✅</span>} Settled Up
          </button>
        </div>
      )}
    </div>
  );
};

export default FundCard; 