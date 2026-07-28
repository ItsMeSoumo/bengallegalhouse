import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passwordHash } = body;

    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@LawCBT123";
    const computedHash = createHash("sha256").update(adminPassword).digest("hex");

    if (passwordHash === computedHash) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
