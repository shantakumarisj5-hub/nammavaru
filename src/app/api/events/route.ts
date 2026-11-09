
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Fetch events
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const events = await sql`
      SELECT
        e.*,
        COUNT(er.id)::int AS attendee_count,
        COALESCE(
          BOOL_OR(er.user_id = ${userId}),
          false
        ) AS is_registered
      FROM events e
      LEFT JOIN event_registrations er
        ON er.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date ASC, e.event_time ASC
    `;

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET events error:", error);

    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}

// POST: Create event
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
        {
          error: "Your account is suspended. You cannot create events.",
        },
        { status: 403 }
      );
    }

    // Only approved event organizers and platform admins can publish.
    const capabilities = await sql`
      SELECT capability
      FROM member_capabilities
      WHERE user_id = ${userId}
        AND capability = 'event_organizer'
        AND status = 'approved'
      LIMIT 1
    `;

    const admins = await sql`
      SELECT user_id
      FROM platform_admins
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (capabilities.length === 0 && admins.length === 0) {
      return NextResponse.json(
        {
          error: "You need an approved event organizer capability to create events.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      title,
      description,
      category,
      city,
      venue,
      event_date,
      event_time,
    } = body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      typeof city !== "string" ||
      typeof venue !== "string" ||
      !title.trim() ||
      !description.trim() ||
      !category.trim() ||
      !city.trim() ||
      !venue.trim() ||
      !event_date ||
      !event_time
    ) {
      return NextResponse.json(
        { error: "Please fill in all event fields" },
        { status: 400 }
      );
    }

    if (
      title.length > 150 ||
      description.length > 5000 ||
      category.length > 50 ||
      city.length > 100 ||
      venue.length > 200
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 400 }
      );
    }

    if (
      typeof event_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event_date)
    ) {
      return NextResponse.json(
        { error: "Invalid event date" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(`${event_date}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== event_date
    ) {
      return NextResponse.json(
        { error: "Invalid event date" },
        { status: 400 }
      );
    }

    if (
      typeof event_time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(event_time)
    ) {
      return NextResponse.json(
        { error: "Invalid event time" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const creatorName =
      [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ") || "Nammavaru Member";

    const result = await sql`
      INSERT INTO events (
        title,
        description,
        category,
        city,
        venue,
        event_date,
        event_time,
        created_by
      )
      VALUES (
        ${title.trim()},
        ${description.trim()},
        ${category.trim()},
        ${city.trim()},
        ${venue.trim()},
        ${event_date},
        ${event_time},
        ${userId}
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        message: "Event created successfully",
        event: {
          ...result[0],
          creator_name: creatorName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST event error:", error);

    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
