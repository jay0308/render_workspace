import { NextRequest, NextResponse } from 'next/server';
import { getConfigData, getTeamFunData, updateTeamFunData } from '../../../utils/JSONBlobUtils';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing match expense id' }, { status: 400 });
    }
    // Authenticate user
    const config = await getConfigData();
    const adminId = config?.ADMIN_PROFILE_ID;
    const matchFundManagerId = config?.MATCH_FUND_MANAGER_PROFILE_ID;
    const profileId = req.headers.get('x-profile-id');
    const isMatchFundManager = matchFundManagerId && (
      Array.isArray(matchFundManagerId)
        ? matchFundManagerId.map(String).includes(String(profileId))
        : String(matchFundManagerId) === String(profileId)
    );
    if (!profileId || (String(profileId) !== String(adminId) && !isMatchFundManager)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Fetch current team funds blob
    const teamFunds = await getTeamFunData();
    if (!teamFunds || !Array.isArray(teamFunds.matchExpenseList)) {
      return NextResponse.json({ error: 'No match expenses found' }, { status: 404 });
    }
    // Remove the match expense
    const updatedMatchExpenseList = teamFunds.matchExpenseList.filter((e: any) => String(e.id) !== String(id));
    await updateTeamFunData({ ...teamFunds, matchExpenseList: updatedMatchExpenseList });
    return NextResponse.json({ success: true, matchExpenseList: updatedMatchExpenseList });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
} 