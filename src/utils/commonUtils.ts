// Calculate penalty for a fund and due date
export function calculatePenalty(
  fund: any,
  dueDate: string,
  playerId: string,
  penaltyPerDay: number
): number {
  if (!fund.payments || fund.payments[playerId] !== 'unpaid' || !dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  if (today <= due) return 0;
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return daysOverdue * penaltyPerDay;
} 