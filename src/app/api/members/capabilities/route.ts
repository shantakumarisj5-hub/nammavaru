
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const allowedCapabilities = [
  "mentor",
  "referrer",
  "recruiter",
  "job_publisher",
  "event_organizer",
];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const capability = String(body.capability || "").trim();

    if (!allowedCapabilities.includes(capability)) {
      return NextResponse.json(
        { error: "Invalid capability requested." },
        { status: 400 }
      );
    }

    const profiles = await sql`
      SELECT user_id
      FROM member_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Please create your member profile first." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO member_capabilities (
        user_id,
        capability,
        status
      )
      VALUES (
        ${userId},
        ${capability},
        'pending'
      )
      ON CONFLICT (user_id, capability)
      DO UPDATE SET
        status = CASE
          WHEN member_capabilities.status IN ('approved', 'suspended')
          THEN member_capabilities.status
          ELSE 'pending'
        END,
        requested_at = CASE
          WHEN member_capabilities.status IN ('approved', 'suspended')
          THEN member_capabilities.requested_at
          ELSE CURRENT_TIMESTAMP
        END
      RETURNING capability, status, requested_at;
    `;

    const request = result[0];

    if (request.status === "approved") {
      return NextResponse.json({
        message: "You already have this capability.",
        capability: request,
      });
    }

    if (request.status === "suspended") {
      return NextResponse.json(
        { error: "This capability is currently suspended." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Capability request submitted for review.",
      capability: request,
    });
  } catch (error) {
    console.error("Capability request error:", error);

    return NextResponse.json(
      { error: "Failed to submit capability request." },
      { status: 500 }
    );
  }
}
