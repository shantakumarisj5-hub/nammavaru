
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

const allowedTypes = [
  "student",
  "fresher",
  "professional",
  "startup",
  "employer",
];

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profiles = await sql`
      SELECT *
      FROM member_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const capabilities = await sql`
      SELECT capability, status, requested_at, reviewed_at
      FROM member_capabilities
      WHERE user_id = ${userId}
      ORDER BY requested_at DESC
    `;

    return NextResponse.json({
      profile: profiles[0] || null,
      capabilities,
    });
  } catch (error) {
    console.error("Member profile GET error:", error);

    return NextResponse.json(
      { error: "Failed to load member profile." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Suspended members cannot create or modify profiles.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot update your profile.",
        },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const memberType = String(body.memberType ?? "").trim();

    if (!allowedTypes.includes(memberType)) {
      return NextResponse.json(
        { error: "Please select a valid member type." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO member_profiles (user_id, member_type)
      VALUES (${userId}, ${memberType})
      ON CONFLICT (user_id)
      DO UPDATE SET
        member_type = EXCLUDED.member_type,
        verification_status =
          CASE
            WHEN member_profiles.member_type
              IS DISTINCT FROM EXCLUDED.member_type
            THEN 'unverified'
            ELSE member_profiles.verification_status
          END,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return NextResponse.json({
      message: "Member profile saved successfully.",
      profile: result[0],
    });
  } catch (error) {
    console.error("Member profile POST error:", error);

    return NextResponse.json(
      { error: "Failed to save member profile." },
      { status: 500 }
    );
  }
}
