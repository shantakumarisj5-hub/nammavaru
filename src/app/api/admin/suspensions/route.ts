
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

async function isPlatformAdmin(userId: string) {
  const result = await sql`
    SELECT user_id
    FROM platform_admins
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return result.length > 0;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(await isPlatformAdmin(userId))) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const suspensions = await sql`
      SELECT *
      FROM member_suspensions
      ORDER BY
        CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 500
    `;

    const client = await clerkClient();

    const memberIds = [
      ...new Set(suspensions.map((item) => String(item.user_id))),
    ];

    const names = new Map<string, string>();

    await Promise.all(
      memberIds.map(async (id) => {
        try {
          const user = await client.users.getUser(id);

          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "Nammavaru Member";

          names.set(id, name);
        } catch {
          names.set(id, "Unknown Member");
        }
      })
    );

    return NextResponse.json({
      suspensions: suspensions.map((item) => ({
        ...item,
        memberName:
          names.get(String(item.user_id)) || "Unknown Member",
      })),
    });
  } catch (error) {
    console.error("Admin suspensions GET error:", error);

    return NextResponse.json(
      { error: "Unable to load suspension records." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId: adminId } = await auth();

    if (!adminId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!(await isPlatformAdmin(adminId))) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const targetUserId = String(body.userId ?? "").trim();
    const action = String(body.action ?? "").trim();
    const reason = String(body.reason ?? "").trim();

    if (
      !targetUserId ||
      targetUserId.length > 255 ||
      !["suspend", "restore"].includes(action)
    ) {
      return NextResponse.json(
        { error: "A valid member ID and action are required." },
        { status: 400 }
      );
    }

    if (targetUserId === adminId) {
      return NextResponse.json(
        { error: "You cannot suspend or restore your own account." },
        { status: 400 }
      );
    }

    // Do not allow one platform admin to modify another admin.
    if (await isPlatformAdmin(targetUserId)) {
      return NextResponse.json(
        { error: "Platform administrator accounts cannot be modified here." },
        { status: 403 }
      );
    }

    const client = await clerkClient();

    try {
      await client.users.getUser(targetUserId);
    } catch {
      return NextResponse.json(
        { error: "Member account not found." },
        { status: 404 }
      );
    }

    if (action === "suspend") {
      if (reason.length < 10 || reason.length > 1000) {
        return NextResponse.json(
          {
            error: "Suspension reason must contain 10–1000 characters.",
          },
          { status: 400 }
        );
      }

      const existing = await sql`
        SELECT id
        FROM member_suspensions
        WHERE user_id = ${targetUserId}
          AND status = 'active'
        LIMIT 1
      `;

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "This member already has an active suspension." },
          { status: 409 }
        );
      }

      try {
        const result = await sql`
          INSERT INTO member_suspensions (
            user_id,
            reason,
            status,
            suspended_by
          )
          VALUES (
            ${targetUserId},
            ${reason},
            'active',
            ${adminId}
          )
          RETURNING *
        `;

        return NextResponse.json(
          {
            message: "Member suspended successfully.",
            suspension: result[0],
          },
          { status: 201 }
        );
      } catch (error) {
        const dbError = error as { code?: string };

        // Handles simultaneous suspension requests.
        if (dbError.code === "23505") {
          return NextResponse.json(
            { error: "This member already has an active suspension." },
            { status: 409 }
          );
        }

        throw error;
      }
    }

    const restored = await sql`
      UPDATE member_suspensions
      SET
        status = 'restored',
        restored_at = CURRENT_TIMESTAMP,
        restored_by = ${adminId}
      WHERE user_id = ${targetUserId}
        AND status = 'active'
      RETURNING *
    `;

    if (restored.length === 0) {
      return NextResponse.json(
        { error: "This member does not have an active suspension." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Member access restored successfully.",
      suspension: restored[0],
    });
  } catch (error) {
    console.error("Admin suspensions POST error:", error);

    return NextResponse.json(
      { error: "Unable to update member suspension." },
      { status: 500 }
    );
  }
}
