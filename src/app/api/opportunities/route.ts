
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

const allowedTypes = [
  "Job",
  "Internship",
  "Part-time",
  "Remote",
];

const allowedModes = [
  "On-site",
  "Remote",
  "Hybrid",
];

export async function GET() {
  try {
    const { userId } = await auth();

    const opportunities = await sql`
      SELECT *
      FROM opportunities
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      opportunities,
      currentUserId: userId || "",
    });
  } catch (error) {
    console.error("GET opportunities error:", error);

    return NextResponse.json(
      { error: "Unable to load opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Block suspended members.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot publish opportunities.",
        },
        { status: 403 }
      );
    }

    // Only approved job publishers, recruiters, employers,
    // or platform admins can publish opportunities.
    const capabilities = await sql`
      SELECT capability
      FROM member_capabilities
      WHERE user_id = ${userId}
        AND capability IN ('job_publisher', 'recruiter')
        AND status = 'approved'
    `;

    const admins = await sql`
      SELECT user_id
      FROM platform_admins
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const profile = await sql`
      SELECT member_type
      FROM member_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const isEmployer =
      profile.length > 0 &&
      profile[0].member_type === "employer";

    const isAuthorized =
      capabilities.length > 0 ||
      isEmployer ||
      admins.length > 0;

    if (!isAuthorized) {
      return NextResponse.json(
        {
          error:
            "You need an approved job publisher or recruiter capability, or an employer profile, to publish opportunities.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const company =
      typeof body.company === "string" ? body.company.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const opportunityType = body.opportunityType;
    const workMode = body.workMode;
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";
    const applicationUrl =
      typeof body.applicationUrl === "string"
        ? body.applicationUrl.trim()
        : "";

    if (!title || !company || !location || !description) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    if (
      title.length > 200 ||
      company.length > 200 ||
      location.length > 150 ||
      description.length > 5000
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(opportunityType)) {
      return NextResponse.json(
        { error: "Invalid opportunity type" },
        { status: 400 }
      );
    }

    if (!allowedModes.includes(workMode)) {
      return NextResponse.json(
        { error: "Invalid work mode" },
        { status: 400 }
      );
    }

    if (applicationUrl) {
      try {
        const parsedUrl = new URL(applicationUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL protocol");
        }
      } catch {
        return NextResponse.json(
          { error: "Please enter a valid application URL" },
          { status: 400 }
        );
      }
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const postedByName =
      user.fullName ||
      user.username ||
      user.firstName ||
      "Community Member";

    const result = await sql`
      INSERT INTO opportunities (
        title,
        company,
        location,
        opportunity_type,
        work_mode,
        description,
        application_url,
        posted_by,
        posted_by_name
      )
      VALUES (
        ${title},
        ${company},
        ${location},
        ${opportunityType},
        ${workMode},
        ${description},
        ${applicationUrl || null},
        ${userId},
        ${postedByName}
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        message: "Opportunity published successfully",
        opportunity: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST opportunity error:", error);

    return NextResponse.json(
      { error: "Unable to publish opportunity" },
      { status: 500 }
    );
  }
}
