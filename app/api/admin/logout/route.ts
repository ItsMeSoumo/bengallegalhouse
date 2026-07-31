import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/adminAuth";

export async function POST() {
  try {
    console.log(`🔑 [API POST: /api/admin/logout] Admin logging out. Clearing session cookie...`);
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin logout route:", error);
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 });
  }
}
