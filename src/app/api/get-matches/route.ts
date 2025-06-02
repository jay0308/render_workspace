import { NextRequest, NextResponse } from "next/server";
import { getJSONBlob } from "@/utils/JSONBlobUtils";

export async function GET() {
  try {
    const blobData = await getJSONBlob();
    const matches = Array.isArray(blobData.matches) ? blobData.matches : [];
    return NextResponse.json({ matches });
  } catch (error) {
    return NextResponse.json({ matches: [], error: (error as Error).message }, { status: 200 });
  }
} 