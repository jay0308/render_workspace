import React, { useState, useEffect, useCallback } from "react";
import AddFundModal from "./AddFundModal";
import PaymentsModal from "./PaymentsModal";
import PlayerPaymentsModal from "./PlayerPaymentsModal";
import FundCard from "./FundCard";
import AddExpenseModal from "./AddExpenseModal";
import AddMatchExpenseModal from "./AddMatchExpenseModal";
import { post, get } from "../utils/request";
import { calculatePenalty } from '../utils/commonUtils';
import TickAnimationModal from './TickAnimationModal';
import DeleteFundDialog from "./DeleteFundDialog";
import PlayersExpensesModal from "./PlayersExpensesModal";

interface TeamFundsTabProps {
  teamConfig: any;
}

const TeamFundsTab: React.FC<TeamFundsTabProps> = ({ teamConfig }) => {
  // Get current profile id from localStorage
  let profileId: string | null = null;
  if (typeof window !== "undefined") {
    profileId = localStorage.getItem("cricheroes_profile_id");
  }
  const isAdmin = teamConfig && profileId && String(teamConfig.ADMIN_PROFILE_ID) === String(profileId);
  const isFundManager = teamConfig && profileId && String(teamConfig.FUND_MANAGER_PROFILE_ID) === String(profileId);

  // Permission: admin or match fund manager
  const isMatchFundManager = teamConfig && profileId && (
    (Array.isArray(teamConfig.MATCH_FUND_MANAGER_PROFILE_ID)
      ? teamConfig.MATCH_FUND_MANAGER_PROFILE_ID.map(String).includes(String(profileId))
      : String(teamConfig.MATCH_FUND_MANAGER_PROFILE_ID) === String(profileId))
  );
  const canManageMatchFunds = isAdmin || isMatchFundManager;

  // Total balance state, fetched from backend
  const [totalBalance, setTotalBalance] = useState(0);
  // Add totalExpense state
  const [totalExpense, setTotalExpense] = useState(0);

  const [activeTab, setActiveTab] = useState<'funds' | 'expenses' | 'match-expenses'>('funds');
  const [showModal, setShowModal] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const [loadingFunds, setLoadingFunds] = useState(false);
  const [editFund, setEditFund] = useState<any | null>(null);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState<any | null>(null);

  // Player Payments Modal state
  const [showPlayerPaymentsModal, setShowPlayerPaymentsModal] = useState(false);
  const [playerPayments, setPlayerPayments] = useState<{ playerId: string; playerName: string; profileImage?: string; due: number; fundIds: string[] }[]>([]);

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Add state for match expense modal
  const [showMatchExpenseModal, setShowMatchExpenseModal] = useState(false);

  // Add match expenses state
  const [matchExpenseList, setMatchExpenseList] = useState<any[]>([]);
  // Animation modal state
  const [showSettleAnimation, setShowSettleAnimation] = useState(false);
  const [settleMessage, setSettleMessage] = useState("");
  // Edit modal state
  const [editingMatchExpense, setEditingMatchExpense] = useState<any | null>(null);

  // Add state for PlayersExpensesModal
  const [showPlayersExpensesModal, setShowPlayersExpensesModal] = useState(false);
  const [selectedMatchExpense, setSelectedMatchExpense] = useState<any | null>(null);

  // Add loader state for expenses
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Get all players from config
  const allPlayers = Array.isArray(teamConfig?.teamMembers)
    ? teamConfig.teamMembers.map((m: any) => ({
        playerId: m.playerId,
        playerName: m.playerName,
        profileImage: m.profileImage,
        isActive: m.isActive,
      }))
    : [];

  // Get penalty amount per day from config
  const PENALTY_AMOUNT_PER_DAY = Number(teamConfig?.PENALTY_AMOUNT_PER_DAY) || 0;

  // Fetch funds and totalBalance on mount or when modal closes
  useEffect(() => {
    const fetchFunds = async () => {
      setLoadingFunds(true);
      try {
        const response = await get<{ fundList: any[]; totalBalance?: number }>("/api/get-funds");
        setFunds(Array.isArray(response?.fundList) ? response.fundList : []);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      } catch (e) {
        setFunds([]);
        setTotalBalance(0);
      } finally {
        setLoadingFunds(false);
      }
    };
    fetchFunds();
  }, [showModal]);

  // Fetch expenses on mount or when modal closes
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await get<{ expenseList: any[]; totalBalance?: number; totalExpense?: number }>("/api/get-expenses");
        setExpenses(Array.isArray(response?.expenseList) ? response.expenseList : []);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
        if (typeof response.totalExpense === 'number') setTotalExpense(response.totalExpense);
      } catch (e) {
        setExpenses([]);
      }
    };
    console.log("showExpenseModal", showExpenseModal);
    fetchExpenses();
  }, [showExpenseModal]);

  // Fetch match expenses on mount and after add/modify/delete
  const fetchMatchExpenses = async () => {
    try {
      const response = await get<{ matchExpenseList: any[] }>("/api/get-match-expenses");
      setMatchExpenseList(Array.isArray(response?.matchExpenseList) ? response.matchExpenseList : []);
    } catch (e) {
      setMatchExpenseList([]);
    }
  };
  useEffect(() => {
    if (!showMatchExpenseModal) {
      fetchMatchExpenses();
    }
  }, [showMatchExpenseModal]);

  useEffect(() => {
    const handleFundSettledUp = () => {
      setSettleMessage('Fund Settled Up!');
      setShowSettleAnimation(true);
      // Optionally, refetch funds here if needed
    };
    window.addEventListener('fundSettledUp', handleFundSettledUp);
    return () => window.removeEventListener('fundSettledUp', handleFundSettledUp);
  }, []);

  const handleAddFundSave = async (data: { description: string; amount: number; dueDate: string; players: string[]; id?: string }) => {
    try {
      setLoadingFunds(true);
      // If editing, include id
      const payload = editFund ? { ...data, id: editFund.id } : data;
      const response: any = await post("/api/add-fund", payload);
      if (response && Array.isArray(response.funds)) {
        setFunds(response.funds);
      } else {
        // fallback: refetch funds
        const resp = await get<{ fundList: any[] }>("/api/get-funds");
        setFunds(Array.isArray(resp?.fundList) ? resp.fundList : []);
      }
      setShowModal(false);
      setEditFund(null);
    } catch (e: any) {
      alert(e.message || "Failed to add fund");
    } finally {
      setLoadingFunds(false);
    }
  };

  const handleDeleteFund = (fundId: string) => {
    const fund = funds.find((f: any) => String(f.id) === String(fundId));
    if (!fund) return;
    // Find all players who paid
    const amounts: Record<string, number> = {};
    if (fund.payments) {
      Object.entries(fund.payments).forEach(([pid, status]) => {
        if (status === 'paid') {
          amounts[pid] = Number(fund.amount) || 0;
        }
      });
    }
    setDeleteDialog({ fund, amounts });
  };

  const confirmDeleteFund = async () => {
    if (!deleteDialog) return;
    try {
      setLoadingFunds(true);
      await post("/api/delete-fund", { id: deleteDialog.fund.id, amounts: deleteDialog.amounts });
      // Always refresh funds and balance after delete
      const resp = await get<{ fundList: any[]; totalBalance?: number }>("/api/get-funds");
      setFunds(Array.isArray(resp?.fundList) ? resp.fundList : []);
      if (typeof resp.totalBalance === 'number') setTotalBalance(resp.totalBalance);
      setDeleteDialog(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete fund");
    } finally {
      setLoadingFunds(false);
    }
  };

  // Update totalBalance after payment status change
  const handleStatusChange = async (playerId: string, newStatus: 'paid' | 'unpaid', amount?: number) => {
    try {
      setLoadingFunds(true);
      const response: any = await post('/api/update-fund-payment', { fundId: selectedFund.id, playerId, status: newStatus, amount });
      if (response && Array.isArray(response.funds)) {
        setFunds(response.funds);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
        // update selectedFund to reflect new status
        const updated = response.funds.find((f: any) => String(f.id) === String(selectedFund.id));
        setSelectedFund(updated);
      } else {
        const resp: any = await get('/api/get-funds');
        setFunds(Array.isArray(resp?.fundList) ? resp.fundList : []);
        if (typeof resp.totalBalance === 'number') setTotalBalance(resp.totalBalance);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update payment status');
    } finally {
      setLoadingFunds(false);
    }
  };

  // Calculate player due amounts for the modal
  const calculatePlayerPayments = () => {
    const playerMap: Record<string, { playerName: string; profileImage?: string; due: number; fundIds: string[] }> = {};
    allPlayers.forEach((p: any) => {
      playerMap[p.playerId] = { playerName: p.playerName, profileImage: p.profileImage, due: 0, fundIds: [] };
    });
    funds.forEach(fund => {
      if (fund.payments) {
        Object.entries(fund.payments).forEach(([pid, status]) => {
          if (status === 'unpaid' && playerMap[pid]) {
            playerMap[pid].due += Number(fund.amount) || 0;
            playerMap[pid].fundIds.push(fund.id);
          }
        });
      }
    });
    setPlayerPayments(
      Object.entries(playerMap)
        .map(([playerId, data]: [string, any]) => ({ playerId, ...data }))
        .filter((p: any) => p.due > 0)
        .sort((a: any, b: any) => b.due - a.due)
    );
  };

  // Handler to mark all funds as paid for a player
  const handleMarkAllPaid = async (playerId: string, fundIds: string[], amounts: Record<string, number>) => {
    setLoadingFunds(true);
    try {
      const response: any = await post('/api/update-player-fund-payments', { playerId, fundIds, status: 'paid', amounts });
      setFunds(Array.isArray(response?.funds) ? response.funds : []);
      if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      calculatePlayerPayments();
      setShowPlayerPaymentsModal(false);
    } catch (e: any) {
      alert(e.message || 'Failed to mark all as paid');
    } finally {
      setLoadingFunds(false);
    }
  };

  // Handler to mark all funds as unpaid for a player
  const handleMarkAllUnpaid = async (playerId: string, fundIds: string[], amounts: Record<string, number>) => {
    setLoadingFunds(true);
    try {
      const response: any = await post('/api/update-player-fund-payments', { playerId, fundIds, status: 'unpaid', amounts });
      setFunds(Array.isArray(response?.funds) ? response.funds : []);
      if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      calculatePlayerPayments();
      setShowPlayerPaymentsModal(false);
    } catch (e: any) {
      alert(e.message || 'Failed to mark all as unpaid');
    } finally {
      setLoadingFunds(false);
    }
  };

  // WhatsApp share for overall player dues
  const handleShareOverallDueWhatsapp = () => {
    let msg = '*Team Funds - Player Due Summary*\n';
    const playerMap: Record<string, { playerName: string; due: number; penalty: number }> = {};
    allPlayers.forEach((p: any) => {
      playerMap[p.playerId] = { playerName: p.playerName, due: 0, penalty: 0 };
    });
    funds.forEach(fund => {
      if (fund.payments) {
        Object.entries(fund.payments).forEach(([pid, status]) => {
          if (status === 'unpaid' && playerMap[pid]) {
            playerMap[pid].due += Number(fund.amount) || 0;
            playerMap[pid].penalty += calculatePenalty(fund, fund.dueDate, pid, PENALTY_AMOUNT_PER_DAY);
          }
        });
      }
    });
    const dues = Object.entries(playerMap)
      .map(([_, data]) => data)
      .filter(p => p.due > 0)
      .sort((a, b) => b.due - a.due);
    if (dues.length === 0) {
      msg += '\nNo dues for any player!';
    } else {
      dues.forEach(p => {
        if (p.penalty > 0) {
          msg += `\n- ${p.playerName}: ₹${p.due + p.penalty} (Penalty: ₹${p.penalty})`;
        } else {
          msg += `\n- ${p.playerName}: ₹${p.due}`;
        }
      });
    }
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Handler to share expense via WhatsApp
  const handleShareExpense = (expense: any) => {
    const text = `Expense: ${expense.description}\nAmount: ₹${expense.amount}\nDate: ${new Date(expense.createdDate).toLocaleDateString()}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Handler to delete expense
  const handleDeleteExpense = async (expenseId: string, amount: number) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      setLoadingExpenses(true);
      const response: any = await post('/api/delete-expense', { id: expenseId, amount });
      if (response && Array.isArray((response as any).expenseList)) {
        setExpenses((response as any).expenseList);
        if (typeof (response as any).totalBalance === 'number') setTotalBalance((response as any).totalBalance);
        if (typeof (response as any).totalExpense === 'number') setTotalExpense((response as any).totalExpense);
      }
    } catch (e) {
      alert('Failed to delete expense');
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Add clear expense handler
  const handleClearExpense = async (expenseId: string) => {
    if (!window.confirm('Clear this expense? This will just remove the card and not affect totals.')) return;
    try {
      setLoadingExpenses(true);
      const response: any = await post('/api/delete-expense', { id: expenseId, clearOnly: true });
      if (response && Array.isArray((response as any).expenseList)) {
        setExpenses((response as any).expenseList);
      }
    } catch (e) {
      alert('Failed to clear expense');
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Handler to modify expense (open modal prefilled)
  const handleModifyExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    setShowExpenseModal(true);
  };

  // Add editingExpenseId state
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Update handleAddExpenseSave to handle edit, now receives data from modal
  const handleAddExpenseSave = async ({ description, amount, id }: { description: string; amount: number; id?: string }) => {
    try {
      setLoadingExpenses(true);
      let response: any;
      if (id) {
        response = await post("/api/modify-expense", { id, description, amount });
      } else {
        response = await post("/api/add-expense", { description, amount });
      }
      if (response && Array.isArray((response as any).expenseList)) {
        setExpenses((response as any).expenseList);
        if (typeof (response as any).totalBalance === 'number') setTotalBalance((response as any).totalBalance);
        if (typeof (response as any).totalExpense === 'number') setTotalExpense((response as any).totalExpense);
      }
      setShowExpenseModal(false);
      setEditingExpenseId(null);
    } catch (e: any) {
      alert(e.message || "Failed to save expense");
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Handler to add match expense
  const handleAddMatchExpenseSave = async (data: any) => {
    try {
      setLoadingFunds(true);
      const response: any = await post("/api/add-match-expense", data);
      if (response && Array.isArray(response.matchExpenseList)) {
        setMatchExpenseList(response.matchExpenseList);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      } else {
        await fetchMatchExpenses();
      }
      setShowMatchExpenseModal(false);
    } catch (e: any) {
      alert(e.message || "Failed to add match expense");
    } finally {
      setLoadingFunds(false);
    }
  };

  // Handler to modify match expense
  const handleModifyMatchExpenseSave = async (data: any) => {
    try {
      setLoadingFunds(true);
      const response: any = await post("/api/modify-match-expense", data);
      if (response && Array.isArray(response.matchExpenseList)) {
        setMatchExpenseList(response.matchExpenseList);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      } else {
        await fetchMatchExpenses();
      }
      setEditingMatchExpense(null);
    } catch (e: any) {
      alert(e.message || "Failed to modify match expense");
    } finally {
      setLoadingFunds(false);
    }
  };

  // Handler to settle up (delete) match expense
  const handleSettleUpMatchExpense = async (expense: any) => {
    if (!window.confirm('Are you sure you want to settle up this expense?')) return;
    try {
      setLoadingFunds(true);
      const response: any = await post("/api/delete-match-expense", { id: expense.id });
      if (response && Array.isArray(response.matchExpenseList)) {
        setMatchExpenseList(response.matchExpenseList);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      } else {
        await fetchMatchExpenses();
      }
      setSettleMessage("Expense Settled Up!");
      setShowSettleAnimation(true);
    } catch (e: any) {
      alert(e.message || "Failed to settle up expense");
    } finally {
      setLoadingFunds(false);
    }
  };

  // Render expenses in All Expenses tab
  const renderExpenses = () => (
    <div className="space-y-6 mt-4">
      {expenses.length === 0 && <div className="text-gray-500 text-center">No expenses yet.</div>}
      {expenses.map(expense => (
        <div key={expense.id} className="rounded-xl shadow-md bg-white p-5 mb-6 border border-gray-100">
          <div className="mb-4">
            <div className="text-xl font-bold text-blue-800">{expense.description}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 font-medium">Amount:</span>
              <span className="font-bold text-blue-600 text-lg">₹{expense.amount}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 font-medium">Date:</span>
              <span className="text-gray-600">{expense.createdDate ? new Date(expense.createdDate).toLocaleDateString() : '-'}</span>
            </div>
          </div>
          {(isAdmin || isFundManager) && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition"
                onClick={() => handleShareExpense(expense)}
                title="Share on WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.72 13.06a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a.75.75 0 01-.97.32 7.5 7.5 0 01-3.3-3.3.75.75 0 01.32-.97l.5-.3c.2-.13.35-.34.4-.57.05-.23 0-.47-.13-.67a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a1.75 1.75 0 00-.18 1.6c.7 1.7 2.1 3.1 3.8 3.8.2.08.42.06.6-.06l.5-.3c.2-.13.44-.18.67-.13.23.05.44.2.57.4l.3.5c.13.2.18.44.13.67-.05.23-.2.44-.4.57z" /></svg>
                Share
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition"
                onClick={() => handleModifyExpense(expense)}
              >
                <span>✏️</span> Modify
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-700 bg-white hover:bg-red-50 font-semibold shadow transition"
                onClick={() => handleDeleteExpense(expense.id, expense.amount)}
              >
                <span>🗑️</span> Delete
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-700 bg-white hover:bg-gray-50 font-semibold shadow transition"
                onClick={() => handleClearExpense(expense.id)}
              >
                <span>🧹</span> Clear
              </button>
            </div>
          )}
        </div>
      ))}
      {loadingExpenses && <LoaderOverlay />}
    </div>
  );

  // Render match expenses
  const renderMatchExpenses = () => {
    // At the top of the match expenses section, before rendering cards, show total due if needed
    let totalUserDue = 0;
    let dueCount = 0;
    if (profileId && matchExpenseList.length > 2) {
      matchExpenseList.forEach(expense => {
        if (expense.playersExpensesDetails && expense.playersExpensesDetails.summary) {
          const userSummary = expense.playersExpensesDetails.summary.find((s: any) => String(s.id) === String(profileId));
          if (userSummary && userSummary.net < 0) {
            totalUserDue += -userSummary.net;
            dueCount++;
          }
        }
      });
    }
    return (
      <div className="space-y-6 mt-4">
        {/* Total Due Summary Box */}
        {dueCount > 1 && (
          <div className="mb-4 flex items-center justify-center w-full">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl text-lg font-bold flex flex-col items-end gap-0 shadow">
              <span>⚠️ Your Total Due: ₹{totalUserDue.toFixed(2)}</span>
            </div>
          </div>
        )}
        {matchExpenseList.length === 0 && <div className="text-gray-500 text-center">No match expenses yet.</div>}
        {matchExpenseList.map(expense => {
          // Find user summary if available
          let userSummary = null;
          if (expense.playersExpensesDetails && profileId) {
            userSummary = (expense.playersExpensesDetails.summary || []).find((s: any) => String(s.id) === String(profileId));
          }
          // Calculate due date and payment status
          const dueDate = expense.dueDate ? new Date(expense.dueDate) : null;
          const now = new Date();
          let badge = null;
          if (userSummary) {
            const isPaid = userSummary.net >= 0;
            let badgeColor = '';
            let badgeText = '';
            if (!isPaid && dueDate && now > dueDate) {
              badgeColor = 'bg-red-600 text-white';
              badgeText = `Due: ₹${(-userSummary.net).toFixed(2)} (Overdue)`;
            } else if (!isPaid && dueDate && now <= dueDate) {
              badgeColor = 'bg-orange-500 text-white';
              badgeText = `Due: ₹${(-userSummary.net).toFixed(2)}`;
            } else if (isPaid) {
              badgeColor = 'bg-green-600 text-white';
              badgeText = 'Paid';
            }
            badge = (
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ml-2 ${badgeColor}`}>{badgeText}</span>
            );
          }
          // Check if the logged-in user is paid or settled up for this match expense
          let isPaid = false;
          let isSettled = false;
          if (expense.playersExpensesDetails) {
            const { participants = [], tempPlayers = [] } = expense.playersExpensesDetails;
            const all = [...participants, ...tempPlayers];
            isSettled = all.some((p: any) => String(p.id) === String(profileId) && p.settled === true);
            isPaid = all.some((p: any) => String(p.id) === String(profileId) && p.paid && Number(p.paid) >= (p.totalOwed || 0));
          }
          // Only show due badge if NOT paid and NOT settled
          const showDueBadge = !isPaid && !isSettled;
          return (
            <div key={expense.id} className="rounded-xl shadow-md bg-white p-5 mb-6 border border-gray-100">
              <div className="mb-4">
                <div className="text-xl font-bold text-orange-800 flex items-center">
                  {expense.description}
                  {showDueBadge && badge}
                  {(isPaid || isSettled) && (
                    <span className="ml-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-300">Paid</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-700 font-medium">Match Fees:</span>
                  <span className="font-bold text-orange-600 text-lg">₹{expense.matchFees || expense.amount}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-700 font-medium">Due Date:</span>
                  <span className="text-gray-600">{expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-700 font-medium">Paid By:</span>
                  <span className="text-gray-800 font-semibold">{(() => {
                    const player = allPlayers.find((p: any) => p.playerId === expense.paidBy);
                    return player ? player.playerName : expense.paidBy || '-';
                  })()}</span>
                </div>
                {/* Food Bill Paid By */}
                {expense.foodPaidBy && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-700 font-medium">Food Bill Paid By:</span>
                    <span className="text-gray-800 font-semibold">{(() => {
                      const player = allPlayers.find((p: any) => p.playerId === expense.foodPaidBy);
                      return player ? player.playerName : expense.foodPaidBy;
                    })()}</span>
                  </div>
                )}
                {/* Food Bill as one blue line */}
                {expense.playersExpensesDetails && expense.playersExpensesDetails.paidAmount > 0 && (
                  <div className="mt-1 text-blue-700 font-semibold text-sm">
                    Food Bill: ₹{expense.playersExpensesDetails.paidAmount} paid by {(() => {
                      const player = allPlayers.find((p: any) => p.playerId === expense.playersExpensesDetails.payerId);
                      return player ? player.playerName : expense.playersExpensesDetails.payerId || '-';
                    })()}
                  </div>
                )}
                {/* Created Date in light text */}
                {expense.createdDate && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 text-xs">Created at: {new Date(expense.createdDate).toLocaleString()}</span>
                  </div>
                )}

              {/* After the main card info in renderMatchExpenses, show payment status for admin/fund manager */}
              {(isAdmin || isMatchFundManager) && expense.playersExpensesDetails && Array.isArray(expense.playersExpensesDetails.summary) && (() => {
                const summary = expense.playersExpensesDetails.summary;
                const total = summary.length;
                const paid = summary.filter((s: any) => (s.net >= 0 || s.settled)).length;
                const unpaid = total - paid;
                if (total === 0) return null;
                if (paid === total) {
                  return <div className="mt-2 text-green-700 font-semibold text-sm">Everybody has paid, please settle up</div>;
                } else if (paid / total <= 0.5) {
                  return <div className="mt-2 text-red-600 font-semibold text-sm">Only {paid} have paid</div>;
                } else {
                  return <div className="mt-2 text-orange-600 font-semibold text-sm">Only {unpaid} are left</div>;
                }
              })()}
                {canManageMatchFunds && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-orange-600 text-orange-700 bg-white hover:bg-orange-50 font-semibold shadow transition"
                      onClick={() => { setSelectedMatchExpense(expense); setShowPlayersExpensesModal(true); }}
                    >
                      <span>👥</span> Players Expenses
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition"
                      onClick={() => setEditingMatchExpense(expense)}
                    >
                      <span>✏️</span> Modify
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition col-span-2"
                      onClick={() => {
                        // Build share message
                        let msg = `Match Expense: ${expense.description}\n`;
                        msg += `Match Fees: ₹${expense.matchFees || expense.amount}\n`;
                        if (expense.playersExpensesDetails && expense.playersExpensesDetails.paidAmount > 0) {
                          const payer = allPlayers.find((p: any) => p.playerId === expense.playersExpensesDetails.payerId);
                          msg += `Food Bill: ₹${expense.playersExpensesDetails.paidAmount} paid by ${payer ? payer.playerName : expense.playersExpensesDetails.payerId}\n`;
                        }
                        msg += `Due Date: ${expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '-'}\n`;
                        // List players who owe (net < 0 and not settled)
                        if (expense.playersExpensesDetails && Array.isArray(expense.playersExpensesDetails.summary)) {
                          const owingPlayers = expense.playersExpensesDetails.summary.filter((s: any) => s.net < 0 && !s.settled);
                          if (owingPlayers.length > 0) {
                            msg += `\nPlayers with Due:\n`;
                            owingPlayers.forEach((s: any) => {
                              msg += `- ${s.name} (₹${(-s.net).toFixed(2)})\n`;
                            });
                          }
                        }
                        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                        window.open(url, '_blank');
                      }}
                      title="Share on WhatsApp"
                    >
                      <span>🔗</span> Share
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-700 bg-white hover:bg-gray-50 font-semibold shadow transition col-span-2"
                      onClick={() => handleSettleUpMatchExpense(expense)}
                    >
                      <span>✅</span> Settled Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // State for delete fund confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<null | { fund: any; amounts: Record<string, number> }> (null);

  // Loader overlay
  const LoaderOverlay = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-30">
      <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Add a handler to close PlayersExpensesModal and refetch match expenses
  const handleClosePlayersExpensesModal = useCallback(() => {
    setShowPlayersExpensesModal(false);
    fetchMatchExpenses();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {loadingFunds && <LoaderOverlay />}
      {/* Player Payments CTA and WhatsApp share for admin/fund manager, now below total balance */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-2xl font-bold text-teal-800 mb-2">Team Funds</h2>
        <div className="text-lg font-semibold text-gray-700 mb-1">Total Balance Fund</div>
        <div className={`text-3xl font-bold mb-2 ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>₹ {totalBalance}</div>
        <div className="text-lg font-semibold text-gray-700 mb-1 mt-2">Total Expenses</div>
        <div className="text-3xl font-bold mb-2 text-orange-600">₹ {totalExpense}</div>
        {(isAdmin || isFundManager) && (
          <div className="flex flex-col gap-3 mt-2">
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold shadow-lg text-lg transition-all w-auto"
              onClick={handleShareOverallDueWhatsapp}
              title="Share overall player dues on WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.711.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              <span>Share Dues</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold shadow-lg text-lg transition-all w-auto"
              onClick={() => { calculatePlayerPayments(); setShowPlayerPaymentsModal(true); }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2M5 12h14M12 16v4m0 0h-4m4 0h4"/>
              </svg>
              <span>Player Payments Due</span>
            </button>
          </div>
        )}
      </div>
      {/* Separate Floating Action Buttons for Add Fund and Add Expense */}
      {(isAdmin || isMatchFundManager) && (
        <div className="fixed bottom-20 right-8 z-50 flex flex-col items-end gap-4">
          {activeTab === 'funds' && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
              title="Add Fund"
              onClick={() => setShowModal(true)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {activeTab === 'expenses' && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
              title="Add Expense"
              onClick={() => setShowExpenseModal(true)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4m4-4h8v8H8z" />
              </svg>
            </button>
          )}
          {activeTab === 'match-expenses' && (
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl transition-all"
              title="Add Match Expense"
              onClick={() => setShowMatchExpenseModal(true)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4m4-4h8v8H8z" />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex gap-2 mt-4 mb-6">
          <button
            className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-colors ${activeTab === 'funds' ? 'border-teal-600 text-teal-800 bg-teal-50' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-teal-50'}`}
            onClick={() => setActiveTab('funds')}
          >
            All Funds
          </button>
          <button
            className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-orange-500 text-orange-800 bg-orange-50' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-orange-50'}`}
            onClick={() => setActiveTab('expenses')}
          >
            All Expenses
          </button>
          <button
            className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-colors ${activeTab === 'match-expenses' ? 'border-orange-600 text-orange-900 bg-orange-100' : 'border-transparent text-gray-500 bg-gray-50 hover:bg-orange-100'}`}
            onClick={() => setActiveTab('match-expenses')}
          >
            Match Expenses
          </button>
        </div>
        {activeTab === 'funds' ? (
          loadingFunds ? (
            <div className="text-gray-500 text-center py-8">Loading funds...</div>
          ) : funds.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No funds found.</div>
          ) : (
            <>
              {/* Calculate and show total due for current player */}
              {(() => {
                let currentPlayerId: string | null = null;
                if (typeof window !== "undefined") {
                  currentPlayerId = localStorage.getItem("cricheroes_profile_id");
                }
                let totalDue = 0;
                let totalPenalty = 0;
                if (currentPlayerId) {
                  for (const fund of funds) {
                    if (fund.payments && fund.payments[currentPlayerId] === 'unpaid') {
                      const penalty = calculatePenalty(fund, fund.dueDate, currentPlayerId, PENALTY_AMOUNT_PER_DAY);
                      totalDue += Number(fund.amount) + penalty;
                      totalPenalty += penalty;
                    }
                  }
                }
                if (totalDue > 0) {
                  return (
                    <div className="mb-6 flex items-center justify-center w-full">
                      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl text-lg font-bold flex flex-col items-end gap-0 shadow">
                        <span>⚠️ Your Total Due: ₹{totalDue}</span>
                        {totalPenalty > 0 && (
                          <span className="text-base font-normal text-red-600 pr-1">(Penalty: ₹{totalPenalty})</span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="space-y-4">
                {funds.map(fund => (
                  <FundCard
                    key={fund.id}
                    fund={{ ...fund, allPlayers }}
                    isAdmin={isAdmin}
                    isFundManager={isFundManager}
                    onPayments={() => { setSelectedFund(fund); setShowPaymentsModal(true); }}
                    onModify={() => { setEditFund(fund); setShowModal(true); }}
                    onDelete={() => handleDeleteFund(fund.id)}
                    penaltyPerDay={PENALTY_AMOUNT_PER_DAY}
                    setFunds={setFunds}
                  />
                ))}
              </div>
            </>
          )
        ) : activeTab === 'expenses' ? (
          renderExpenses()
        ) : (
          renderMatchExpenses()
        )}
      </div>
      <AddFundModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditFund(null); }}
        allPlayers={allPlayers}
        onSave={handleAddFundSave}
        initialData={editFund}
      />
      {/* Payments Modal */}
      {showPaymentsModal && selectedFund && (
        <PaymentsModal
          fund={selectedFund}
          allPlayers={allPlayers}
          isAdmin={isAdmin}
          isFundManager={isFundManager}
          onClose={() => { setShowPaymentsModal(false); setSelectedFund(null); }}
          onStatusChange={handleStatusChange}
          teamConfig={teamConfig}
          calculatePenalty={(fund, dueDate, playerId) => calculatePenalty(fund, dueDate, playerId, PENALTY_AMOUNT_PER_DAY)}
        />
      )}
      {/* Player Payments Modal */}
      {showPlayerPaymentsModal && (
        <PlayerPaymentsModal
          playerPayments={playerPayments}
          funds={funds}
          penaltyPerDay={PENALTY_AMOUNT_PER_DAY}
          isAdmin={isAdmin}
          isFundManager={isFundManager}
          onClose={() => setShowPlayerPaymentsModal(false)}
          onMarkAllPaid={handleMarkAllPaid}
          onMarkAllUnpaid={handleMarkAllUnpaid}
          loading={loadingFunds}
        />
      )}
      {/* Render AddExpenseModal */}
      {showExpenseModal && (
        <AddExpenseModal
          initialData={editingExpenseId ? expenses.find(e => e.id === editingExpenseId) : null}
          isEdit={!!editingExpenseId}
          onSave={({ description, amount }) => {
            if (editingExpenseId) {
              handleAddExpenseSave({ description, amount, id: editingExpenseId });
            } else {
              handleAddExpenseSave({ description, amount });
            }
          }}
          onCancel={() => {
            setShowExpenseModal(false);
            setEditingExpenseId(null);
          }}
        />
      )}
      {/* AddMatchExpenseModal for add/edit */}
      {showMatchExpenseModal && (
        <AddMatchExpenseModal
          isOpen={showMatchExpenseModal}
          onClose={() => setShowMatchExpenseModal(false)}
          allPlayers={allPlayers}
          onSave={handleAddMatchExpenseSave}
        />
      )}
      {editingMatchExpense && (
        <AddMatchExpenseModal
          isOpen={!!editingMatchExpense}
          onClose={() => setEditingMatchExpense(null)}
          allPlayers={allPlayers}
          onSave={data => handleModifyMatchExpenseSave({ ...data, id: editingMatchExpense.id })}
          initialData={editingMatchExpense}
        />
      )}
      {/* AwardAnimationModal for settled up */}
      <TickAnimationModal
        open={showSettleAnimation}
        onClose={() => setShowSettleAnimation(false)}
        message={settleMessage}
      />
      {/* Delete Fund Confirmation Dialog */}
      <DeleteFundDialog
        open={!!deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={confirmDeleteFund}
        fund={deleteDialog?.fund}
        amounts={deleteDialog?.amounts || {}}
        allPlayers={allPlayers}
        setAmounts={(amounts: any) => setDeleteDialog(d => d ? { ...d, amounts } : d)}
      />
      {/* PlayersExpensesModal integration */}
      <PlayersExpensesModal
        open={showPlayersExpensesModal}
        onClose={handleClosePlayersExpensesModal}
        matchExpense={selectedMatchExpense}
        squadPlayers={allPlayers.filter((p: any) => selectedMatchExpense?.players?.includes(p.playerId))}
        allPlayers={allPlayers}
        teamConfig={teamConfig}
      />
    </div>
  );
};

export default TeamFundsTab; 