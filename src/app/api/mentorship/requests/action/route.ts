
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended members from managing requests.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot manage mentorship requests.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const requestId = Number(body.requestId);
    const action = String(body.action || "").trim();

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        { error: "Invalid request ID" },
        { status: 400 }
      );
    }

    if (!["accept", "decline", "complete"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    // Check the request and identify the other member.
    const requests = await sql`
      SELECT id, mentor_id, requester_id, status
      FROM mentorship_requests
      WHERE id = ${requestId}
      LIMIT 1
    `;

    if (requests.length === 0) {
      return NextResponse.json(
        { error: "Mentorship request not found" },
        { status: 404 }
      );
    }

    const mentorshipRequest = requests[0];

    // Only the mentor can perform these actions.
    if (mentorshipRequest.mentor_id !== userId) {
      return NextResponse.json(
        { error: "Only the mentor can update this request" },
        { status: 403 }
      );
    }

    // Do not allow actions on requests involving suspended members.
    const requesterSuspension = await getActiveSuspension(
      mentorshipRequest.requester_id
    );

    if (requesterSuspension) {
      return NextResponse.json(
        {
          error: "This request involves a suspended member. Actions are unavailable.",
        },
        { status: 403 }
      );
    }

    let updated;

    if (action === "accept") {
      updated = await sql`
        UPDATE mentorship_requests
        SET status = 'accepted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
          AND mentor_id = ${userId}
          AND status = 'pending'
        RETURNING id, status
      `;
    }

    if (action === "decline") {
      updated = await sql`
        UPDATE mentorship_requests
        SET status = 'declined',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
          AND mentor_id = ${userId}
          AND status = 'pending'
        RETURNING id, status
      `;
    }

    if (action === "complete") {
      updated = await sql`
        UPDATE mentorship_requests
        SET status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${requestId}
          AND mentor_id = ${userId}
          AND status = 'accepted'
        RETURNING id, status
      `;
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        {
          error:
            "Request not found, already processed, or you are not allowed to perform this action",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mentorship request ${action}ed successfully`,
      request: updated[0],
    });
  } catch (error) {
    console.error("Mentorship action error:", error);

    return NextResponse.json(
      { error: "Failed to update mentorship request" },
      { status: 500 }
    );
  }
}
