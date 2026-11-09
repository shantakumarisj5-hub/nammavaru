
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Incoming connection requests
    const requests = await sql`
      SELECT
        id,
        requester_id,
        created_at
      FROM member_connections
      WHERE receiver_id = ${userId}
        AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 30
    `;

    // Unread messages
    const unreadMessages = await sql`
      SELECT
        id,
        sender_id,
        message,
        created_at
      FROM messages
      WHERE receiver_id = ${userId}
        AND is_read = FALSE
      ORDER BY created_at DESC
      LIMIT 30
    `;

    const senderIds = Array.from(
      new Set([
        ...requests.map((item) => item.requester_id),
        ...unreadMessages.map((item) => item.sender_id),
      ])
    );

    const client = await clerkClient();

    const names = new Map<string, string>();

    await Promise.all(
      senderIds.map(async (id) => {
        try {
          const user = await client.users.getUser(id);

          const name =
            [user.firstName, user.lastName]
              .filter(Boolean)
              .join(" ") || "Nammavaru Member";

          names.set(id, name);
        } catch {
          names.set(id, "Nammavaru Member");
        }
      })
    );

    const notifications = [
      ...requests.map((item) => ({
        id: `request-${item.id}`,
        type: "connection",
        title: "New connection request",
        description: `${names.get(item.requester_id)} sent you a connection request.`,
        created_at: item.created_at,
        href: "/connections",
      })),

      ...unreadMessages.map((item) => ({
        id: `message-${item.id}`,
        type: "message",
        title: "New message",
        description: `${names.get(item.sender_id)}: ${item.message}`,
        created_at: item.created_at,
        href: "/messages",
      })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      notifications,
      unreadCount: unreadMessages.length,
      requestCount: requests.length,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);

    return NextResponse.json(
      { error: "Could not load notifications" },
      { status: 500 }
    );
  }
}
