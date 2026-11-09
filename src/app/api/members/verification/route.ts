
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended members.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot request verification.",
        },
        { status: 403 }
      );
    }

    const profiles = await sql`
      SELECT verification_status
      FROM member_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (profiles.length === 0) {
      return NextResponse.json(
        {
          error: "Complete your member profile before requesting verification.",
        },
        { status: 404 }
      );
    }

    const currentStatus = profiles[0].verification_status;

    if (currentStatus === "verified") {
      return NextResponse.json(
        { error: "Your account is already verified." },
        { status: 409 }
      );
    }

    if (currentStatus === "pending") {
      return NextResponse.json(
        { error: "Your verification request is already under review." },
        { status: 409 }
      );
    }

    const updated = await sql`
      UPDATE member_profiles
      SET
        verification_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
        AND verification_status <> 'pending'
        AND verification_status <> 'verified'
      RETURNING verification_status
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Your verification status has changed. Please refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Verification request submitted successfully.",
      verificationStatus: updated[0].verification_status,
    });
  } catch (error) {
    console.error("Verification request error:", error);

    return NextResponse.json(
      { error: "Could not submit verification request." },
      { status: 500 }
    );
  }
}
