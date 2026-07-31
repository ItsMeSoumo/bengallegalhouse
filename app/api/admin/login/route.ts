import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminToken, setAdminSessionCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passwordHash } = body;
    console.log(`\n🔑 [API POST: /api/admin/login] Admin login verification request received.`);

    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@LawCBT123";
    const computedHash = createHash("sha256").update(adminPassword).digest("hex");

    if (passwordHash === computedHash) {
      console.log(`🔑 [API POST: /api/admin/login] Password match! Admin authorized. Issuing secure HTTP-Only cookie...`);
      const token = createAdminToken();
      await setAdminSessionCookie(token);
      return NextResponse.json({ success: true });
    }

    console.warn(`🔑 [API POST: /api/admin/login] Unauthorized admin login attempt. Hashes do not match.`);
    return NextResponse.json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  } catch (error) {
    console.error(`🔑 [API POST: /api/admin/login] Error processing login request:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
