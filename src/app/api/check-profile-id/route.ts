import { NextResponse } from 'next/server';
import { getConfigData } from '../../../utils/JSONBlobUtils';

export async function POST(req: Request) {
  try {
    const { profileId } = await req.json();
    if (!profileId) return NextResponse.json({ success: false });

    // Get config data
    const config = await getConfigData();
    const adminIds = config?.ADMIN_PROFILE_ID || '';
    const teamMembers = Array.isArray(config?.teamMembers) ? config.teamMembers : [];

    // Check admin
    if (String(adminIds) === String(profileId)) {
      return NextResponse.json({ success: true, isAdmin: true });
    }
    // Check team member
    if (teamMembers.some((m: any) => String(m.playerId) === String(profileId))) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false });
  } catch {
    return NextResponse.json({ success: false });
  }
} 