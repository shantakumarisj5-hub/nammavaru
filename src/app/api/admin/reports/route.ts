
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isPlatformAdmin(userId))) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const reports = await sql`
      SELECT
        r.id,
        r.reporter_id,
        r.reported_user_id,
        r.reason,
        r.description,
        r.status,
        r.admin_notes,
        r.created_at,
        r.reviewed_at,

        (
          SELECT COUNT(*)
          FROM member_reports mr
          WHERE mr.reported_user_id = r.reported_user_id
        ) AS total_reports,

        (
          SELECT COUNT(*)
          FROM member_reports mr
          WHERE mr.reported_user_id = r.reported_user_id
          AND mr.status IN ('pending', 'reviewing')
        ) AS active_reports

      FROM member_reports r

      ORDER BY
        CASE
          WHEN r.status IN ('pending', 'reviewing') THEN 0
          ELSE 1
        END,
        r.created_at DESC
    `;

    const client = await clerkClient();

    const userIds = [
      ...new Set(
        reports.flatMap((report) => [
          String(report.reporter_id),
          String(report.reported_user_id),
        ])
      ),
    ];

    const userNames = new Map<string, string>();

    await Promise.all(
      userIds.map(async (id) => {
        try {
          const user = await client.users.getUser(id);

          const name =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            "Nammavaru Member";

          userNames.set(id, name);
        } catch {
          userNames.set(id, "Unknown Member");
        }
      })
    );

    const formattedReports = reports.map((report) => ({
      ...report,
      totalReports: Number(report.total_reports),
      activeReports: Number(report.active_reports),
      reporterName:
        userNames.get(String(report.reporter_id)) || "Unknown Member",
      reportedName:
        userNames.get(String(report.reported_user_id)) || "Unknown Member",
    }));

    return NextResponse.json({
      reports: formattedReports,
    });
  } catch (error) {
    console.error("Admin reports GET error:", error);

    return NextResponse.json(
      { error: "Unable to load reports." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isPlatformAdmin(userId))) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const reportId = Number(body.reportId);
    const status = String(body.status || "").trim();
    const adminNotes = String(body.adminNotes || "").trim();

    const allowedStatuses = ["reviewing", "action_taken", "dismissed"];

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return NextResponse.json(
        { error: "Invalid report ID." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid report status." },
        { status: 400 }
      );
    }

    if (adminNotes.length > 2000) {
      return NextResponse.json(
        { error: "Admin notes cannot exceed 2000 characters." },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE member_reports
      SET
        status = ${status},
        admin_notes = ${adminNotes || null},
        reviewed_by = ${userId},
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ${reportId}
        AND status IN ('pending', 'reviewing')
      RETURNING id, status, admin_notes, reviewed_at
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Report not found or already closed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Report updated successfully.",
      report: updated[0],
    });
  } catch (error) {
    console.error("Admin reports PATCH error:", error);

    return NextResponse.json(
      { error: "Unable to update report." },
      { status: 500 }
    );
  }
}
