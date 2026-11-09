
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Fetch members and connection requests
// Suspended members can still view their connections.
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const result = await client.users.getUserList({ limit: 100 });

    const members = result.data
      .filter((user) => user.id !== userId)
      .map((user) => {
        const metadata = user.unsafeMetadata || {};

        const fullName =
          [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ") || "Nammavaru Member";

        return {
          id: user.id,
          name: fullName,
          city:
            typeof metadata.city === "string"
              ? metadata.city
              : "",
          profession:
            typeof metadata.profession === "string"
              ? metadata.profession
              : "",
          interests: Array.isArray(metadata.interests)
            ? metadata.interests
            : [],
        };
      });

    const connections = await sql`
      SELECT
        id,
        requester_id,
        receiver_id,
        status,
        created_at
      FROM member_connections
      WHERE requester_id = ${userId}
         OR receiver_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      currentUserId: userId,
      members,
      connections,
    });
  } catch (error) {
    console.error("Connections GET error:", error);

    return NextResponse.json(
      { error: "Could not load connections" },
      { status: 500 }
    );
  }
}

// POST: Send a connection request
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended members from sending requests
    const senderSuspension = await getActiveSuspension(userId);

    if (senderSuspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot send connection requests.",
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

    if (!receiverId || receiverId === userId) {
      return NextResponse.json(
        { error: "Invalid member selected" },
        { status: 400 }
      );
    }

    // Confirm the target member exists
    const client = await clerkClient();
    await client.users.getUser(receiverId);

    // Block requests to suspended accounts
    const receiverSuspension = await getActiveSuspension(receiverId);

    if (receiverSuspension) {
      return NextResponse.json(
        {
          error: "This member's account is currently suspended.",
        },
        { status: 403 }
      );
    }

    const existing = await sql`
      SELECT id, requester_id, receiver_id, status
      FROM member_connections
      WHERE
        (requester_id = ${userId} AND receiver_id = ${receiverId})
        OR
        (requester_id = ${receiverId} AND receiver_id = ${userId})
      LIMIT 1
    `;

    if (existing.length > 0) {
      const connection = existing[0];

      if (connection.status === "accepted") {
        return NextResponse.json(
          { error: "You are already connected" },
          { status: 409 }
        );
      }

      if (
        connection.status === "pending" &&
        connection.receiver_id === userId
      ) {
        return NextResponse.json(
          {
            error:
              "This member has already sent you a request. Check incoming requests.",
          },
          { status: 409 }
        );
      }

      if (connection.status === "pending") {
        return NextResponse.json(
          { error: "Connection request already sent" },
          { status: 409 }
        );
      }

      if (connection.status === "rejected") {
        return NextResponse.json(
          {
            error: "This connection request was previously rejected",
          },
          { status: 409 }
        );
      }
    }

    const created = await sql`
      INSERT INTO member_connections (requester_id, receiver_id)
      VALUES (${userId}, ${receiverId})
      RETURNING id, status
    `;

    return NextResponse.json(
      {
        message: "Connection request sent",
        connection: created[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Connections POST error:", error);

    return NextResponse.json(
      { error: "Could not send connection request" },
      { status: 500 }
    );
  }
}
