
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Invalid member ID." },
        { status: 400 }
      );
    }

    const profiles = await sql`
      SELECT
        user_id,
        member_type,
        verification_status
      FROM member_profiles
      WHERE user_id = ${id}
      LIMIT 1
    `;

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "Member profile not found." },
        { status: 404 }
      );
    }

    const details = await sql`
      SELECT
        headline,
        bio,
        education,
        institution,
        graduation_year,
        skills,
        experience_years,
        current_company,
        job_title,
        linkedin_url,
        portfolio_url
      FROM member_details
      WHERE user_id = ${id}
      LIMIT 1
    `;

    const client = await clerkClient();
    const member = await client.users.getUser(id);

    const metadata = member.unsafeMetadata || {};

    return NextResponse.json({
      member: {
        id: member.id,
        name:
          member.fullName ||
          member.username ||
          "Nammavaru Member",
        imageUrl: member.imageUrl,
        city:
          typeof metadata.city === "string"
            ? metadata.city
            : "",
        profession:
          typeof metadata.profession === "string"
            ? metadata.profession
            : "",
        memberType: profiles[0].member_type,
        verificationStatus: profiles[0].verification_status,
        details: details[0] || null,
      },
    });
  } catch (error) {
    console.error("Public member profile error:", error);

    return NextResponse.json(
      { error: "Unable to load member profile." },
      { status: 500 }
    );
  }
}
