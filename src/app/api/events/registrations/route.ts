
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// POST: Register for an event
export async function POST(request: Request) {
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
        { error: "Your account is suspended. You cannot register for events." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsedId = Number(body?.eventId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await sql`
      SELECT id, event_date
      FROM events
      WHERE id = ${parsedId}
      LIMIT 1
    `;

    if (event.length === 0) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const existingRegistration = await sql`
      SELECT id
      FROM event_registrations
      WHERE event_id = ${parsedId}
        AND user_id = ${userId}
      LIMIT 1
    `;

    if (existingRegistration.length > 0) {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 }
      );
    }

    await sql`
      INSERT INTO event_registrations (event_id, user_id)
      VALUES (${parsedId}, ${userId})
      ON CONFLICT (event_id, user_id) DO NOTHING
    `;

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register event error:", error);

    return NextResponse.json(
      { error: "Could not register for event" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel own event registration
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsedId = Number(body?.eventId);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM event_registrations
      WHERE event_id = ${parsedId}
        AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel registration error:", error);

    return NextResponse.json(
      { error: "Could not cancel registration" },
      { status: 500 }
    );
  }
}
