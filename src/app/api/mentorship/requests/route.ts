
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Fetch mentorship requests
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Existing requests remain readable.
    const rows = await sql`
      SELECT *
      FROM mentorship_requests
      WHERE mentor_id = ${userId}
         OR requester_id = ${userId}
      ORDER BY created_at DESC
    `;

    const client = await clerkClient();

    const requests = await Promise.all(
      rows.map(async (request: any) => {
        const otherUserId =
          request.mentor_id === userId
            ? request.requester_id
            : request.mentor_id;

        let otherUserName = "Nammavaru Member";

        try {
          const otherUser = await client.users.getUser(otherUserId);

          otherUserName =
            `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() ||
            "Nammavaru Member";
        } catch {
          // Keep fallback name if user lookup fails.
        }

        return {
          ...request,
          direction:
            request.requester_id === userId ? "sent" : "received",
          other_user_name: otherUserName,
        };
      })
    );

    return NextResponse.json({
      requests,
      currentUserId: userId,
    });
  } catch (error) {
    console.error("GET mentorship requests error:", error);

    return NextResponse.json(
      { error: "Failed to load mentorship requests" },
      { status: 500 }
    );
  }
}

// POST: Create mentorship request
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended requesters.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot send mentorship requests.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const mentorId = String(body.mentorId || "").trim();
    const message = String(body.message || "").trim();
    const goals = String(body.goals || "").trim();

    if (!mentorId || !message) {
      return NextResponse.json(
        { error: "Mentor and request message are required." },
        { status: 400 }
      );
    }

    if (mentorId === userId) {
      return NextResponse.json(
        { error: "You cannot request mentorship from yourself." },
        { status: 400 }
      );
    }

    if (message.length > 2000 || goals.length > 2000) {
      return NextResponse.json(
        { error: "Message and goals must be under 2000 characters." },
        { status: 400 }
      );
    }

    // Block requests to suspended mentors.
    const mentorSuspension = await getActiveSuspension(mentorId);

    if (mentorSuspension) {
      return NextResponse.json(
        { error: "This mentor is currently unavailable." },
        { status: 403 }
      );
    }

    const mentors = await sql`
      SELECT user_id
      FROM mentor_profiles
      WHERE user_id = ${mentorId}
        AND is_available = TRUE
      LIMIT 1
    `;

    if (mentors.length === 0) {
      return NextResponse.json(
        { error: "This mentor is not available currently." },
        { status: 404 }
      );
    }

    // Check for an existing active request.
    const existing = await sql`
      SELECT id, status
      FROM mentorship_requests
      WHERE mentor_id = ${mentorId}
        AND requester_id = ${userId}
        AND status IN ('pending', 'accepted')
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error:
            existing[0].status === "pending"
              ? "You have already sent a request to this mentor. Please wait for their response."
              : "Your mentorship request with this mentor is already active.",
          duplicate: true,
        },
        { status: 409 }
      );
    }

    // Insert request. The database unique index also protects
    // against simultaneous duplicate requests.
    try {
      const result = await sql`
        INSERT INTO mentorship_requests (
          mentor_id,
          requester_id,
          message,
          goals
        )
        VALUES (
          ${mentorId},
          ${userId},
          ${message},
          ${goals || null}
        )
        RETURNING *
      `;

      return NextResponse.json(
        {
          message: "Mentorship request sent successfully!",
          request: result[0],
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      if (dbError?.code === "23505") {
        return NextResponse.json(
          {
            error: "You already have an active request with this mentor.",
            duplicate: true,
          },
          { status: 409 }
        );
      }

      throw dbError;
    }
  } catch (error) {
    console.error("POST mentorship request error:", error);

    return NextResponse.json(
      { error: "Failed to send mentorship request." },
      { status: 500 }
    );
  }
}
