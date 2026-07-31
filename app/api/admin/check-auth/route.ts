import { NextResponse } from "next/server";
import { isAdminAuthenticatedOnServer } from "@/lib/adminAuth";

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticatedOnServer();
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
