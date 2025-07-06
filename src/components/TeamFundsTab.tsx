import React, { useState, useEffect, useCallback } from "react";
import AddFundModal from "./AddFundModal";
import { post, get } from "../utils/request";

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

  // Total balance state, fetched from backend
  const [totalBalance, setTotalBalance] = useState(0);

  const [activeTab, setActiveTab] = useState<'funds' | 'expenses'>('funds');
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

  // Get all players from config
  const allPlayers = Array.isArray(teamConfig?.teamMembers)
    ? teamConfig.teamMembers.map((m: any) => ({
        playerId: m.playerId,
        playerName: m.playerName,
        profileImage: m.profileImage,
        isActive: m.isActive,
      }))
    : [];

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
        const response = await get<{ expenseList: any[]; totalBalance?: number }>("/api/get-expenses");
        setExpenses(Array.isArray(response?.expenseList) ? response.expenseList : []);
        if (typeof response.totalBalance === 'number') setTotalBalance(response.totalBalance);
      } catch (e) {
        setExpenses([]);
      }
    };
    fetchExpenses();
  }, [showExpenseModal]);

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

  const handleDeleteFund = async (fundId: string) => {
    if (!window.confirm("Are you sure you want to delete this fund?")) return;
    try {
      setLoadingFunds(true);
      const response: any = await post("/api/delete-fund", { id: fundId });
      if (response && Array.isArray(response.funds)) {
        setFunds(response.funds);
      } else {
        // fallback: refetch funds
        const resp = await get<{ fundList: any[] }>("/api/get-funds");
        setFunds(Array.isArray(resp?.fundList) ? resp.fundList : []);
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete fund");
    } finally {
      setLoadingFunds(false);
    }
  };

  // Update totalBalance after payment status change
  const handleStatusChange = async (playerId: string, newStatus: 'paid' | 'unpaid') => {
    try {
      setLoadingFunds(true);
      const response: any = await post('/api/update-fund-payment', { fundId: selectedFund.id, playerId, status: newStatus });
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
        .map(([playerId, data]) => ({ playerId, ...data }))
        .filter(p => p.due > 0)
        .sort((a, b) => b.due - a.due)
    );
  };

  // Handler to mark all funds as paid for a player
  const handleMarkAllPaid = async (playerId: string, fundIds: string[]) => {
    setLoadingFunds(true);
    try {
      const response: any = await post('/api/update-player-fund-payments', { playerId, fundIds, status: 'paid' });
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
  const handleMarkAllUnpaid = async (playerId: string, fundIds: string[]) => {
    setLoadingFunds(true);
    try {
      const response: any = await post('/api/update-player-fund-payments', { playerId, fundIds, status: 'unpaid' });
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
    const playerMap: Record<string, { playerName: string; due: number }> = {};
    allPlayers.forEach((p: any) => {
      playerMap[p.playerId] = { playerName: p.playerName, due: 0 };
    });
    funds.forEach(fund => {
      if (fund.payments) {
        Object.entries(fund.payments).forEach(([pid, status]) => {
          if (status === 'unpaid' && playerMap[pid]) {
            playerMap[pid].due += Number(fund.amount) || 0;
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
        msg += `\n- ${p.playerName}: ₹${p.due}`;
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
      const response: any = await post('/api/delete-expense', { id: expenseId, amount });
      if (response && Array.isArray((response as any).expenseList)) {
        setExpenses((response as any).expenseList);
        if (typeof (response as any).totalBalance === 'number') setTotalBalance((response as any).totalBalance);
      }
    } catch (e) {
      alert('Failed to delete expense');
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
      let response: any;
      if (id) {
        response = await post("/api/modify-expense", { id, description, amount });
      } else {
        response = await post("/api/add-expense", { description, amount });
      }
      if (response && Array.isArray((response as any).expenseList)) {
        setExpenses((response as any).expenseList);
        if (typeof (response as any).totalBalance === 'number') setTotalBalance((response as any).totalBalance);
      }
      setShowExpenseModal(false);
      setEditingExpenseId(null);
    } catch (e: any) {
      alert(e.message || "Failed to save expense");
    }
  };

  // Render expenses in All Expenses tab
  const renderExpenses = () => (
    <div className="space-y-6 mt-4">
      {expenses.length === 0 && <div className="text-gray-500 text-center">No expenses yet.</div>}
      {expenses.map(expense => (
        <div key={expense.id} className="rounded-xl shadow-md bg-white p-5 mb-6 border border-gray-100">
          <div className="mb-4">
            <div className="text-xl font-bold text-teal-800">{expense.description}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 font-medium">Amount:</span>
              <span className="font-bold text-green-600 text-lg">₹{expense.amount}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-700 font-medium">Date:</span>
              <span className="text-gray-600">{new Date(expense.createdDate).toLocaleDateString()}</span>
            </div>
          </div>
          {(isAdmin || isFundManager) && (
            <div className="flex flex-col md:flex-row gap-2 mt-4">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold shadow transition"
                onClick={() => handleShareExpense(expense)}
                title="Share on WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.72 13.06a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a.75.75 0 01-.97.32 7.5 7.5 0 01-3.3-3.3.75.75 0 01.32-.97l.5-.3c.2-.13.35-.34.4-.57.05-.23 0-.47-.13-.67a4.5 4.5 0 00-1.27-1.27c-.2-.13-.44-.18-.67-.13-.23.05-.44.2-.57.4l-.3.5a1.75 1.75 0 00-.18 1.6c.7 1.7 2.1 3.1 3.8 3.8.2.08.42.06.6-.06l.5-.3c.2-.13.44-.18.67-.13.23.05.44.2.57.4l.3.5c.13.2.18.44.13.67-.05.23-.2.44-.4.57z" /></svg>
                Share
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow transition"
                onClick={() => handleModifyExpense(expense)}
              >
                <span>✏️</span> Modify
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-600 text-red-700 bg-white hover:bg-red-50 font-semibold shadow transition"
                onClick={() => handleDeleteExpense(expense.id, expense.amount)}
              >
                <span>🗑️</span> Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // AddExpenseModal as a top-level component with local state
  interface AddExpenseModalProps {
    initialData?: { description: string; amount: number } | null;
    onSave: (data: { description: string; amount: number }) => void;
    onCancel: () => void;
    isEdit?: boolean;
  }
  const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ initialData, onSave, onCancel, isEdit }) => {
    const [description, setDescription] = React.useState(initialData?.description || "");
    const [amount, setAmount] = React.useState(initialData?.amount?.toString() || "");
    const [error, setError] = React.useState("");

    const handleSave = () => {
      setError("");
      if (!description.trim()) {
        setError("Description is required");
        return;
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setError("Enter a valid amount");
        return;
      }
      onSave({ description: description.trim(), amount: Number(amount) });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">{isEdit ? 'Modify Expense' : 'Add Expense'}</h2>
            <div className="mb-4">
              <label className="mb-1 font-medium text-gray-700 block">Description</label>
              <input
                className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this expense for?"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 font-medium text-gray-700 block">Amount (₹)</label>
              <input
                className="p-2 border border-gray-300 rounded text-gray-900 bg-white w-full"
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          </div>
          <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
            <button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Player Payments CTA and WhatsApp share for admin/fund manager, now below total balance */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-2xl font-bold text-teal-800 mb-2">Team Funds</h2>
        <div className="text-lg font-semibold text-gray-700 mb-1">Total Balance Fund</div>
        <div className={`text-3xl font-bold mb-2 ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>₹ {totalBalance}</div>
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
      {(isAdmin || isFundManager) && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
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
                if (currentPlayerId) {
                  for (const fund of funds) {
                    if (fund.payments && fund.payments[currentPlayerId] === 'unpaid') {
                      totalDue += Number(fund.amount) || 0;
                    }
                  }
                }
                if (totalDue > 0) {
                  return (
                    <div className="mb-6 flex items-center justify-center">
                      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl text-lg font-bold flex items-center gap-2 shadow">
                        <span>⚠️ Your Total Due:</span> <span>₹{totalDue}</span>
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
                  />
                ))}
              </div>
            </>
          )
        ) : (
          renderExpenses()
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
        />
      )}
      {/* Player Payments Modal */}
      {showPlayerPaymentsModal && (
        <PlayerPaymentsModal
          playerPayments={playerPayments}
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
    </div>
  );
};

// PaymentsModal component
const PaymentsModal: React.FC<{
  fund: any;
  allPlayers: any[];
  isAdmin: boolean;
  isFundManager: boolean;
  onClose: () => void;
  onStatusChange: (playerId: string, newStatus: 'paid' | 'unpaid') => void;
}> = ({ fund, allPlayers, isAdmin, isFundManager, onClose, onStatusChange }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-teal-800 mb-4">Player Payments</h2>
          <div className="mb-4 text-gray-700 font-medium">Fund: <span className="font-semibold">{fund.description}</span></div>
          <div className="flex flex-col gap-2">
            {Object.entries(fund.payments).map(([pid, status]) => {
              const player = allPlayers.find((p: any) => String(p.playerId) === String(pid));
              return (
                <div key={pid} className="flex items-center gap-3 p-2 rounded border border-gray-200 bg-white">
                  {player?.profileImage && (
                    <img src={player.profileImage} alt={player.playerName} className="w-6 h-6 rounded-full object-cover border" />
                  )}
                  <span className="font-medium text-gray-800 flex-1">{player?.playerName || pid}</span>
                  {/* Slide toggle for admins/fund managers */}
                  {(isAdmin || isFundManager) ? (
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={status === 'paid'}
                        onChange={() => onStatusChange(pid, status === 'paid' ? 'unpaid' : 'paid')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-green-400 transition-all relative">
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${status === 'paid' ? 'translate-x-5' : ''}`}></div>
                      </div>
                      <span className={`ml-2 text-xs font-semibold ${status === 'paid' ? 'text-green-700' : 'text-yellow-700'}`}>{status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                    </label>
                  ) : (
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${status === 'paid' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-yellow-100 text-yellow-700 border border-yellow-400'}`}>{status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// FundCard component
const FundCard: React.FC<{
  fund: any;
  isAdmin: boolean;
  isFundManager: boolean;
  onPayments: () => void;
  onModify: () => void;
  onDelete: () => void;
}> = ({ fund, isAdmin, isFundManager, onPayments, onModify, onDelete }) => {
  // Get all players from fund context (for WhatsApp share)
  const allPlayers = fund.allPlayers || [];
  // Compose WhatsApp message
  const getWhatsappMessage = React.useCallback(() => {
    let msg = `*${fund.description}*\n`;
    msg += `Amount: ₹${fund.amount}\n`;
    msg += `Due Date: ${fund.dueDate}\n`;
    msg += `\n*Players Payment Status:*\n`;
    if (fund.payments) {
      Object.entries(fund.payments).forEach(([pid, status]: any) => {
        const player = allPlayers.find((p: any) => String(p.playerId) === String(pid));
        const name = player?.playerName || pid;
        msg += `- ${name}: ${status === 'paid' ? '✅ Paid' : '❌ Unpaid'}\n`;
      });
    }
    return msg;
  }, [fund, allPlayers]);

  const handleWhatsappShare = () => {
    const msg = getWhatsappMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Get current playerId from localStorage
  let currentPlayerId: string | null = null;
  if (typeof window !== "undefined") {
    currentPlayerId = localStorage.getItem("cricheroes_profile_id");
  }
  // Determine payment status for current player
  let cardBg = "bg-white";
  let borderColor = "border-gray-100";
  let showDue = false;
  if (currentPlayerId && fund.payments && fund.payments[currentPlayerId]) {
    const status = fund.payments[currentPlayerId];
    if (status === "paid") {
      cardBg = "bg-green-50";
      borderColor = "border-green-600";
    } else {
      // Not paid, check due date
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
    }
  }

  return (
    <div className={`rounded-xl shadow-md ${cardBg} p-5 mb-6 border-2 ${borderColor}`}>
      <div className="mb-4">
        <div className="text-xl font-bold text-teal-800">{fund.description}</div>
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

// PlayerPaymentsModal component
const PlayerPaymentsModal: React.FC<{
  playerPayments: { playerId: string; playerName: string; profileImage?: string; due: number; fundIds: string[] }[];
  onClose: () => void;
  onMarkAllPaid: (playerId: string, fundIds: string[]) => void;
  onMarkAllUnpaid: (playerId: string, fundIds: string[]) => void;
  loading: boolean;
}> = ({ playerPayments, onClose, onMarkAllPaid, onMarkAllUnpaid, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold text-orange-800 mb-4">Player Due Payments</h2>
          {playerPayments.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No dues for any player!</div>
          ) : (
            <div className="space-y-3">
              {playerPayments.map(player => (
                <div key={player.playerId} className="flex items-center gap-4 p-3 border rounded bg-orange-50">
                  {player.profileImage && (
                    <img src={player.profileImage} alt={player.playerName} className="w-8 h-8 rounded-full object-cover border" />
                  )}
                  <span className="font-semibold text-gray-800 flex-1">{player.playerName}</span>
                  <span className="font-bold text-orange-700 text-lg">₹{player.due}</span>
                  <label className="inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={player.due === 0}
                      disabled={loading}
                      onChange={async (e) => {
                        if (e.target.checked) {
                          // Mark all as paid
                          await onMarkAllPaid(player.playerId, player.fundIds);
                        } else {
                          // Mark all as unpaid
                          await onMarkAllUnpaid(player.playerId, player.fundIds);
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:bg-green-400 transition-all relative">
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${player.due === 0 ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className={`ml-2 text-xs font-semibold ${player.due === 0 ? 'text-green-700' : 'text-yellow-700'}`}>{player.due === 0 ? 'All Paid' : 'Due'}</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t bg-white px-6 py-4 flex justify-end gap-2 pb-32 md:pb-6" style={{ paddingBottom: 'max(3.5rem, env(safe-area-inset-bottom, 0px))', zIndex: 60 }}>
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamFundsTab; 