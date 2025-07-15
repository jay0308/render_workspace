import { NextResponse } from 'next/server';
import { getTeamFunData, updateTeamFunData } from '../../../utils/JSONBlobUtils';
import { getConfigData } from '../../../utils/JSONBlobUtils';

export async function POST(req: Request) {
  try {
    // Get profileId from headers (e.g., 'x-profile-id')
    const profileId = req.headers.get('x-profile-id');
    if (!profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Auth check
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID || '';
    const matchFundManagers = Array.isArray(config?.FUND_MANAGER_PROFILE_ID) ? config.FUND_MANAGER_PROFILE_ID : [];
    const isAdmin = String(profileId) === String(adminId);
    const isManager = matchFundManagers.includes(profileId);
    if (!isAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, description, matchFees, dueDate, players, paidBy } = await req.json();
    if (!id || !Array.isArray(players) || typeof matchFees !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }
    const fundBlob = await getTeamFunData();
    const matchExpenseList = Array.isArray(fundBlob?.matchExpenseList) ? fundBlob.matchExpenseList : [];
    const matchExpense = matchExpenseList.find((exp: any) => exp.id === id);
    if (!matchExpense) {
      return NextResponse.json({ error: 'Match expense not found' }, { status: 404 });
    }
    // Calculate per-player fee (equal split)
    const perPlayerFee = Math.round((matchFees / players.length) * 100) / 100;
    const playerFees: Record<string, number> = {};
    players.forEach((pid: string) => {
      playerFees[pid] = perPlayerFee;
    });

    const playersExpensesDetails = matchExpense?.playersExpensesDetails;
    // get all participants from playersExpensesDetails
    const participants = playersExpensesDetails?.participants || [];
    const filteredParticipants = participants.map((p: any) => {
        if(!p.isSquad || playerFees[p.id]){
            if(p.isSquad){
                p.matchFeeShare = playerFees[p.id];
            }
            return p;
        }
    });


    Object.keys(playerFees).forEach((pid: string) => {
        const p = filteredParticipants.find((p: any) => p.id === pid);
        if(!p){
            const obj = {matchFeeShare : playerFees[pid], playerId : pid, name : config?.teamMembers?.find((p: any) => p.playerId === pid)?.playerName, isSquad : true};
            filteredParticipants.push(obj);
        }
    });

    const updatedPlayersExpensesDetails = {
        participants : filteredParticipants,
    }

    
    // Update the match expense
    const updatedExpense = {
      ...matchExpense,
      description,
      matchFees,
      dueDate,
      players,
      paidBy,
      playerFees,
      playersExpensesDetails: updatedPlayersExpensesDetails,
    };
    matchExpenseList[matchExpenseList.findIndex((exp: any) => exp.id === id)] = updatedExpense;
    await updateTeamFunData({ ...fundBlob, matchExpenseList });
    return NextResponse.json({ success: true, matchExpenseList });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 