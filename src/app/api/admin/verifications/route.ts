
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

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

    const pending = await sql`
      SELECT
        p.user_id,
        p.member_type,
        p.verification_status,
        p.created_at,
        p.updated_at,
        d.headline,
        d.bio,
        d.education,
        d.institution,
        d.skills,
        d.experience_years,
        d.current_company,
        d.job_title,
        d.linkedin_url,
        d.portfolio_url
      FROM member_profiles p
      LEFT JOIN member_details d
        ON d.user_id = p.user_id
      WHERE p.verification_status = 'pending'
      ORDER BY p.updated_at ASC
      LIMIT 200
    `;

    const client = await clerkClient();

    const requests = await Promise.all(
      pending.map(async (profile) => {
        try {
          const user = await client.users.getUser(profile.user_id);

          return {
            userId: profile.user_id,
            name:
              user.fullName ||
              user.username ||
              "Nammavaru Member",
            imageUrl: user.imageUrl,
            email:
              user.emailAddresses.find(
                (email) => email.id === user.primaryEmailAddressId
              )?.emailAddress || "",
            memberType: profile.member_type,
            verificationStatus: profile.verification_status,
            requestedAt: profile.updated_at,
            details: {
              headline: profile.headline,
              bio: profile.bio,
              education: profile.education,
              institution: profile.institution,
              skills: profile.skills || [],
              experienceYears: profile.experience_years,
              currentCompany: profile.current_company,
              jobTitle: profile.job_title,
              linkedinUrl: profile.linkedin_url,
              portfolioUrl: profile.portfolio_url,
            },
          };
        } catch {
          return {
            userId: profile.user_id,
            name: "Unknown Member",
            imageUrl: null,
            email: "",
            memberType: profile.member_type,
            verificationStatus: profile.verification_status,
            requestedAt: profile.updated_at,
            details: {
              headline: profile.headline,
              bio: profile.bio,
              education: profile.education,
              institution: profile.institution,
              skills: profile.skills || [],
              experienceYears: profile.experience_years,
              currentCompany: profile.current_company,
              jobTitle: profile.job_title,
              linkedinUrl: profile.linkedin_url,
              portfolioUrl: profile.portfolio_url,
            },
          };
        }
      })
    );

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Admin verification GET error:", error);

    return NextResponse.json(
      { error: "Could not load verification requests." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const targetUserId =
      typeof body.userId === "string" ? body.userId.trim() : "";

    const action =
      typeof body.action === "string" ? body.action.trim() : "";

    if (
      !targetUserId ||
      targetUserId.length > 255 ||
      !["approve", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid verification action." },
        { status: 400 }
      );
    }

    if (targetUserId === userId) {
      return NextResponse.json(
        {
          error: "You cannot approve or reject your own verification.",
        },
        { status: 403 }
      );
    }

    const newStatus =
      action === "approve" ? "verified" : "rejected";

    const updated = await sql`
      UPDATE member_profiles
      SET
        verification_status = ${newStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${targetUserId}
        AND verification_status = 'pending'
      RETURNING user_id, verification_status
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        {
          error:
            "Pending verification request not found or already reviewed.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        action === "approve"
          ? "Member successfully verified."
          : "Verification request rejected.",
      member: updated[0],
    });
  } catch (error) {
    console.error("Admin verification PATCH error:", error);

    return NextResponse.json(
      { error: "Could not update verification status." },
      { status: 500 }
    );
  }
}
