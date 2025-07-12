import React, { useState, useMemo, useEffect } from 'react';
import { FOOD_MENU } from '../utils/constants';
import { post } from '../utils/request';

// Types
interface FoodItem {
  name: string;
  price: number;
  quantity: number;
}

interface Participant {
  id: string;
  name: string;
  isSquad: boolean;
  matchFeeShare?: number;
  foodItems: FoodItem[];
  paid: number;
  settled: boolean; // Added settled flag
}

interface PlayersExpensesModalProps {
  open: boolean;
  onClose: () => void;
  matchExpense: any;
  squadPlayers: any[];
  allPlayers: any[];
  teamConfig?: any;
}

const PlayersExpensesModal: React.FC<PlayersExpensesModalProps> = ({ open, onClose, matchExpense, squadPlayers, allPlayers, teamConfig }) => {
  // State
  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (!matchExpense) return [];
    return (matchExpense.players || []).map((pid: string) => {
      const player = squadPlayers.find((p: any) => p.playerId === pid);
      return {
        id: pid,
        name: player ? player.playerName : pid,
        isSquad: true,
        matchFeeShare: matchExpense.matchFees ? Number(matchExpense.matchFees) / (matchExpense.players?.length || 1) : 0,
        foodItems: [],
        paid: 0,
        settled: false, // Initialize settled flag
      };
    });
  });
  const [tempName, setTempName] = useState('');
  const [tempPlayers, setTempPlayers] = useState<Participant[]>([]);
  const [payerId, setPayerId] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [misc, setMisc] = useState(0);
  const [customFood, setCustomFood] = useState({ name: '', price: '' });
  const [settled, setSettled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  useEffect(() => {
    if (open && matchExpense) {
      const details = matchExpense.playersExpensesDetails;
      if (details) {
        setParticipants(
          (details.participants || []).map((p: any) => ({
            ...p,
            foodItems: Array.isArray(p.foodItems) ? p.foodItems : [],
          }))
        );
        setTempPlayers(
          (details.tempPlayers || []).map((p: any) => ({
            ...p,
            foodItems: Array.isArray(p.foodItems) ? p.foodItems : [],
          }))
        );
        setPayerId(details.payerId || '');
        setPaidAmount(details.paidAmount !== undefined ? String(details.paidAmount) : '');
        setMisc(details.misc || 0);
        setCustomFood({ name: '', price: '' });
        // Initialize settled state from details
        const settledMap: Record<string, boolean> = {};
        (details.participants || []).forEach((p: any) => { if (p.settled) settledMap[p.id] = true; });
        (details.tempPlayers || []).forEach((p: any) => { if (p.settled) settledMap[p.id] = true; });
        setSettled(settledMap);
      } else {
        setParticipants(
          (matchExpense.players || []).map((pid: string) => {
            const player = squadPlayers.find((p: any) => p.playerId === pid);
            return {
              id: pid,
              name: player ? player.playerName : pid,
              isSquad: true,
              matchFeeShare: matchExpense.matchFees ? Number(matchExpense.matchFees) / (matchExpense.players?.length || 1) : 0,
              foodItems: [],
              paid: 0,
              settled: false, // Initialize settled flag
            };
          })
        );
        setTempPlayers([]);
        setPayerId('');
        setPaidAmount('');
        setMisc(0);
        setCustomFood({ name: '', price: '' });
        setSettled({});
      }
    }
  }, [open, matchExpense, squadPlayers]);

  // Add food item to participant
  const addFood = (pid: string, food: { name: string; price: number }) => {
    setParticipants(prev => prev.map(p =>
      p.id === pid
        ? { ...p, foodItems: [...p.foodItems, { ...food, quantity: 1 }] }
        : p
    ));
  };
  // Add custom food
  const addCustomFood = (pid: string) => {
    if (!customFood.name || !customFood.price) return;
    addFood(pid, { name: customFood.name, price: Number(customFood.price) });
    setCustomFood({ name: '', price: '' });
  };
  // Change food quantity
  const changeFoodQty = (pid: string, idx: number, qty: number) => {
    setParticipants(prev => prev.map(p =>
      p.id === pid
        ? { ...p, foodItems: p.foodItems.map((f, i) => i === idx ? { ...f, quantity: qty } : f) }
        : p
    ));
  };
  // Remove food item
  const removeFood = (pid: string, idx: number) => {
    setParticipants(prev => prev.map(p =>
      p.id === pid
        ? { ...p, foodItems: p.foodItems.filter((_, i) => i !== idx) }
        : p
    ));
  };
  // Add temp member
  const addTemp = () => {
    if (!tempName.trim()) return;
    setTempPlayers(prev => [...prev, {
      id: `temp-${Date.now()}`,
      name: tempName.trim(),
      isSquad: false,
      foodItems: [],
      paid: 0,
      settled: false, // Initialize settled flag
    }]);
    setTempName('');
  };
  // Remove temp member
  const removeTemp = (id: string) => {
    setTempPlayers(prev => prev.filter(p => p.id !== id));
  };
  // Add food to temp
  const addFoodToTemp = (id: string, food: { name: string; price: number }) => {
    setTempPlayers(prev => prev.map(p =>
      p.id === id
        ? { ...p, foodItems: [...p.foodItems, { ...food, quantity: 1 }] }
        : p
    ));
  };
  // Add custom food to temp
  const addCustomFoodToTemp = (id: string) => {
    if (!customFood.name || !customFood.price) return;
    addFoodToTemp(id, { name: customFood.name, price: Number(customFood.price) });
    setCustomFood({ name: '', price: '' });
  };
  // Change food qty for temp
  const changeFoodQtyTemp = (id: string, idx: number, qty: number) => {
    setTempPlayers(prev => prev.map(p =>
      p.id === id
        ? { ...p, foodItems: p.foodItems.map((f, i) => i === idx ? { ...f, quantity: qty } : f) }
        : p
    ));
  };
  // Remove food from temp
  const removeFoodTemp = (id: string, idx: number) => {
    setTempPlayers(prev => prev.map(p =>
      p.id === id
        ? { ...p, foodItems: p.foodItems.filter((_, i) => i !== idx) }
        : p
    ));
  };

  // All participants (squad + temp)
  const allParticipants = useMemo(() => [...participants, ...tempPlayers], [participants, tempPlayers]);

  // Calculate totals
  const foodTotals = allParticipants.map(p => p.foodItems.reduce((sum, f) => sum + f.price * f.quantity, 0));
  const totalFood = foodTotals.reduce((a, b) => a + b, 0);
  const miscValue = Math.max(0, Number(paidAmount) - totalFood);
  const miscPerPerson = miscValue > 0 ? miscValue / allParticipants.filter(p => p.foodItems.length > 0).length : 0;

  // Summary rows
  const matchFeesPaidBy = matchExpense?.paidBy;
  const matchFeesAmount = matchExpense?.matchFees ? Number(matchExpense.matchFees) : 0;
  const summary = allParticipants.map((p, i) => {
    const matchFee = p.isSquad ? (p.matchFeeShare || 0) : 0;
    const food = foodTotals[i];
    const miscShare = p.foodItems.length > 0 ? miscPerPerson : 0;
    let paid = payerId === p.id ? Number(paidAmount) : 0;
    // Add match fees if this player paid the match fees
    if (p.id === matchFeesPaidBy) {
      paid += matchFeesAmount;
    }
    const totalOwed = matchFee + food + miscShare;
    const net = paid - totalOwed;
    return { ...p, matchFee, food, miscShare, totalOwed, paid, net };
  });

  // Prefill paidAmount when payer is selected and paidAmount is empty
  useEffect(() => {
    if (payerId && paidAmount === '') {
      setPaidAmount(totalFood ? String(totalFood) : '');
    }
  }, [payerId, totalFood]);

  // Add handleSave function (currently just closes modal, you can implement actual save logic later)
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const playersExpensesDetails = {
        participants,
        tempPlayers,
        payerId,
        paidAmount: Number(paidAmount),
        misc: miscValue,
        summary,
      };
      const res = await post('/api/save-match-expense-details', {
        matchExpenseId: matchExpense.id,
        playersExpensesDetails,
      });
      setSaving(false);
      onClose();
      // Optionally: show a toast or refresh match expenses
    } catch (e: any) {
      setSaving(false);
      setError(e.message || 'Failed to save');
    }
  };

  if (!open) return null;

  // Determine food menu: use from config if available, else fallback
  const foodMenu = (teamConfig && Array.isArray(teamConfig.FOOD_MENU) && teamConfig.FOOD_MENU.length > 0)
    ? teamConfig.FOOD_MENU
    : FOOD_MENU;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] pb-10">
        <div className="flex-1 overflow-y-auto p-6 pb-4"> {/* Add pb-24 for bottom padding */}
          <h2 className="text-xl font-bold text-orange-800 mb-4">Players Expenses</h2>
          {/* Match Fees Paid By Note */}
          {matchFeesPaidBy && (
            <div className="mb-2 text-sm text-gray-700 font-semibold">
              Match fees paid by: {(() => {
                const player = allParticipants.find(p => p.id === matchFeesPaidBy);
                return player ? player.name : matchFeesPaidBy;
              })()} (₹{matchFeesAmount})
            </div>
          )}
          {/* Participants List */}
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2">Participants</div>
            {allParticipants.map((p, idx) => {
              const isExpanded = expandedParticipant === p.id;
              return (
                <div key={p.id} className="mb-4 p-3 border rounded flex flex-col gap-1 bg-gray-50 w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    {p.isSquad && <span className="text-xs text-orange-600 bg-orange-100 rounded px-2 py-0.5 ml-2">Squad</span>}
                    {!p.isSquad && <button className="ml-auto text-xs text-red-500" onClick={() => removeTemp(p.id)}>Remove</button>}
                    <button
                      className="ml-auto px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                      onClick={() => setExpandedParticipant(isExpanded ? null : p.id)}
                    >
                      {isExpanded ? 'Hide' : 'Edit'}
                    </button>
                  </div>
                  {/* Food Summary */}
                  {p.foodItems.length > 0 && !isExpanded && (
                    <div className="text-xs text-green-700 mt-1">
                      Food: {p.foodItems.map(f => `${f.name} x${f.quantity}`).join(', ')}
                    </div>
                  )}
                  {/* Food Form (collapsible) */}
                  {isExpanded && (
                    <>
                      {p.isSquad && <div className="text-xs text-gray-500">Match Fee: ₹{p.matchFeeShare?.toFixed(2)}</div>}
                      {/* Food Items */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.foodItems.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 bg-green-100 text-green-800 rounded px-2 py-0.5">
                            <span>{f.name} x{f.quantity} (₹{f.price})</span>
                            <button className="ml-1 text-xs text-red-500" onClick={() => p.isSquad ? removeFood(p.id, i) : removeFoodTemp(p.id, i)}>✕</button>
                            <input type="number" min={1} value={f.quantity} onChange={e => p.isSquad ? changeFoodQty(p.id, i, Number(e.target.value)) : changeFoodQtyTemp(p.id, i, Number(e.target.value))} className="w-10 ml-1 p-0.5 border rounded text-xs text-gray-900" />
                          </div>
                        ))}
                      </div>
                      {/* Add Food */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
                        <select className="p-1 border rounded text-gray-900 w-full sm:w-auto" onChange={e => {
                          const food = foodMenu.find((f: any) => f.name === e.target.value);
                          if (food) p.isSquad ? addFood(p.id, food) : addFoodToTemp(p.id, food);
                        }} value="">
                          <option value="">Add food...</option>
                          {foodMenu.map((f: any) => <option key={f.name} value={f.name}>{f.name} (₹{f.price})</option>)}
                        </select>
                        <input type="text" placeholder="Custom food" className="p-1 border rounded text-gray-900 w-full sm:w-auto" value={customFood.name} onChange={e => setCustomFood(c => ({ ...c, name: e.target.value }))} />
                        <input type="number" placeholder="Price" className="p-1 border rounded w-full sm:w-20 text-gray-900" value={customFood.price} onChange={e => setCustomFood(c => ({ ...c, price: e.target.value }))} />
                        <button className="px-2 py-1 bg-blue-500 text-white rounded w-full sm:w-auto" onClick={() => p.isSquad ? addCustomFood(p.id) : addCustomFoodToTemp(p.id)}>Add</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {/* Add Temporary Member */}
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2">Add Temporary Member</div>
            <input type="text" className="p-2 border rounded w-64 mr-2 text-gray-900" placeholder="Name" value={tempName} onChange={e => setTempName(e.target.value)} />
            <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={addTemp}>Add</button>
          </div>
          {/* Total Food Bill */}
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2">Total Food Bill</div>
            <div className="text-2xl font-bold text-gray-900">₹{totalFood.toFixed(2)}</div>
          </div>
          {/* Payer Selector */}
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2">Who Paid?</div>
            <select className="p-2 border rounded w-64 mr-2 text-gray-900" value={payerId} onChange={e => setPayerId(e.target.value)}>
              <option value="">Select payer</option>
              {allParticipants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" className="p-2 border rounded w-32 text-gray-900" placeholder="Amount Paid" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
          </div>
          {/* Miscellaneous Section */}
          {miscValue > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-gray-700 mb-2">Miscellaneous (auto-calculated, split among those who ordered)</div>
              <input type="number" className="p-2 border rounded w-32 text-gray-900" value={miscValue} onChange={e => setMisc(Number(e.target.value))} />
              <div className="text-xs text-gray-500 mt-1">Misc split: ₹{miscPerPerson.toFixed(2)} per participant who ordered</div>
            </div>
          )}
          {/* Summary Table */}
          <div className="mb-4">
            <div className="font-semibold text-gray-700 mb-2">Summary</div>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="p-1 border">Name</th>
                  <th className="p-1 border">Match Fee</th>
                  <th className="p-1 border">Food</th>
                  <th className="p-1 border">Misc</th>
                  <th className="p-1 border">Total Owed</th>
                  <th className="p-1 border">Paid</th>
                  <th className="p-1 border">Net</th>
                  <th className="p-1 border">Settle Up</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr key={row.id} className={row.net < 0 ? 'bg-red-50' : row.net > 0 ? 'bg-green-50' : ''}>
                    <td className="p-1 border text-gray-900 font-medium">{row.name}</td>
                    <td className="p-1 border text-center text-gray-900">₹{row.matchFee.toFixed(2)}</td>
                    <td className="p-1 border text-center text-gray-900">₹{row.food.toFixed(2)}</td>
                    <td className="p-1 border text-center text-gray-900">₹{row.miscShare.toFixed(2)}</td>
                    <td className="p-1 border text-center text-gray-900">₹{row.totalOwed.toFixed(2)}</td>
                    <td className="p-1 border text-center text-gray-900">₹{row.paid.toFixed(2)}</td>
                    <td className="p-1 border text-center text-gray-900 font-bold">{row.net === 0 ? 'Settled' : row.net > 0 ? `Gets ₹${row.net.toFixed(2)}` : `Owes ₹${(-row.net).toFixed(2)}`}</td>
                    <td className="p-1 border text-center">
                      <button
                        className={`px-2 py-1 rounded ${settled[row.id] ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => {
                          setSettled(s => ({ ...s, [row.id]: !s[row.id] }));
                          // Update settled flag in participants or tempPlayers state
                          setParticipants(prev => prev.map(p => p.id === row.id ? { ...p, settled: !settled[row.id] } : p));
                          setTempPlayers(prev => prev.map(p => p.id === row.id ? { ...p, settled: !settled[row.id] } : p));
                        }}
                      >
                        {settled[row.id] ? 'Settled' : 'Settle Up'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="left-0 right-0 bottom-0 flex justify-end gap-2 p-4 border-t bg-white z-20">
          {error && <span className="text-red-600 mr-auto">{error}</span>}
          <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700" onClick={onClose} disabled={saving}>Close</button>
          <button className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-700 text-white font-semibold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
};

export default PlayersExpensesModal; 