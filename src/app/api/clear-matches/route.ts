import { NextRequest, NextResponse } from "next/server";
import { updateJSONBlob, BlobType } from "@/utils/JSONBlobUtils";

export async function POST() {
  try {
    await updateJSONBlob(BlobType.MVP_DATA, {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 