
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Load conversation messages
// Suspended members can still read existing conversations.
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const otherUserId = request.nextUrl.searchParams.get("with");

    if (!otherUserId || otherUserId === userId) {
      return NextResponse.json(
        { error: "A valid user ID is required" },
        { status: 400 }
      );
    }

    const connection = await sql`
      SELECT id
      FROM member_connections
      WHERE status = 'accepted'
      AND (
        (requester_id = ${userId} AND receiver_id = ${otherUserId})
        OR
        (requester_id = ${otherUserId} AND receiver_id = ${userId})
      )
      LIMIT 1
    `;

    if (connection.length === 0) {
      return NextResponse.json(
        { error: "You can message accepted connections only" },
        { status: 403 }
      );
    }

    const messages = await sql`
      SELECT *
      FROM messages
      WHERE
        (sender_id = ${userId} AND receiver_id = ${otherUserId})
        OR
        (sender_id = ${otherUserId} AND receiver_id = ${userId})
      ORDER BY created_at ASC
    `;

    await sql`
      UPDATE messages
      SET is_read = TRUE
      WHERE sender_id = ${otherUserId}
      AND receiver_id = ${userId}
      AND is_read = FALSE
    `;

    const client = await clerkClient();
    const otherUser = await client.users.getUser(otherUserId);

    return NextResponse.json({
      currentUserId: userId,
      otherUser: {
        id: otherUser.id,
        name:
          `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim()
          || "Member",
      },
      messages,
    });
  } catch (error) {
    console.error("GET messages error:", error);

    return NextResponse.json(
      { error: "Unable to load messages" },
      { status: 500 }
    );
  }
}

// POST: Send a message
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended senders
    const senderSuspension = await getActiveSuspension(userId);

    if (senderSuspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot send messages.",
          suspended: true,
          reason: senderSuspension.reason,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const receiverId =
      typeof body.receiverId === "string"
        ? body.receiverId.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!receiverId || !message) {
      return NextResponse.json(
        { error: "Receiver and message are required" },
        { status: 400 }
      );
    }

    if (
      receiverId === userId ||
      message.length > 2000
    ) {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 }
      );
    }

    // Block messages to suspended accounts
    const receiverSuspension = await getActiveSuspension(receiverId);

    if (receiverSuspension) {
      return NextResponse.json(
        {
          error: "This member's account is currently suspended.",
        },
        { status: 403 }
      );
    }

    const connection = await sql`
      SELECT id
      FROM member_connections
      WHERE status = 'accepted'
      AND (
        (requester_id = ${userId} AND receiver_id = ${receiverId})
        OR
        (requester_id = ${receiverId} AND receiver_id = ${userId})
      )
      LIMIT 1
    `;

    if (connection.length === 0) {
      return NextResponse.json(
        { error: "You can message accepted connections only" },
        { status: 403 }
      );
    }

    const result = await sql`
      INSERT INTO messages (sender_id, receiver_id, message)
      VALUES (${userId}, ${receiverId}, ${message})
      RETURNING *
    `;

    return NextResponse.json(
      { message: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST message error:", error);

    return NextResponse.json(
      { error: "Unable to send message" },
      { status: 500 }
    );
  }
}
