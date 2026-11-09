
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

    // Block suspended users from accepting or rejecting requests.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot manage connection requests.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const connectionId = Number(body.connectionId);
    const action = body.action;

    if (
      !Number.isInteger(connectionId) ||
      connectionId <= 0 ||
      !["accept", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const newStatus =
      action === "accept" ? "accepted" : "rejected";

    const updated = await sql`
      UPDATE member_connections
      SET
        status = ${newStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE
        id = ${connectionId}
        AND receiver_id = ${userId}
        AND status = 'pending'
      RETURNING id, status
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Request not found or already handled" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        action === "accept"
          ? "Connection accepted"
          : "Connection request rejected",
      connection: updated[0],
    });
  } catch (error) {
    console.error("Connection action error:", error);

    return NextResponse.json(
      { error: "Could not update connection request" },
      { status: 500 }
    );
  }
}
