
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

const allowedReasons = [
  "fake_profile",
  "scam_or_fraud",
  "harassment",
  "misleading_information",
  "spam",
  "other",
];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const reportedUserId = String(body.reportedUserId || "").trim();
    const reason = String(body.reason || "").trim();
    const description = String(body.description || "").trim();

    if (!reportedUserId || !reason || !description) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (reportedUserId === userId) {
      return NextResponse.json(
        { error: "You cannot report your own account." },
        { status: 400 }
      );
    }

    if (!allowedReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason." },
        { status: 400 }
      );
    }

    if (description.length < 20 || description.length > 1000) {
      return NextResponse.json(
        { error: "Description must contain 20 to 1000 characters." },
        { status: 400 }
      );
    }

    // Confirm that the reported account exists.
    const client = await clerkClient();

    try {
      await client.users.getUser(reportedUserId);
    } catch {
      return NextResponse.json(
        { error: "The reported member does not exist." },
        { status: 404 }
      );
    }

    // Prevent duplicate pending reports from the same member.
    const existing = await sql`
      SELECT id
      FROM member_reports
      WHERE reporter_id = ${userId}
        AND reported_user_id = ${reportedUserId}
        AND status IN ('pending', 'reviewing')
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "You already have an active report for this member.",
        },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO member_reports (
        reporter_id,
        reported_user_id,
        reason,
        description
      )
      VALUES (
        ${userId},
        ${reportedUserId},
        ${reason},
        ${description}
      )
      RETURNING id, status, created_at
    `;

    return NextResponse.json(
      {
        message: "Report submitted successfully.",
        report: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Report submission error:", error);

    return NextResponse.json(
      { error: "Unable to submit report." },
      { status: 500 }
    );
  }
}
