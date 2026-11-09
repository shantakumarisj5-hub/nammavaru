
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

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

    // Get Clerk users
    const client = await clerkClient();

    const { data } = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });

    // Exclude the currently logged-in user
    const otherMembers = data.filter(
      (member) => member.id !== userId
    );

    const userIds = otherMembers.map((member) => member.id);

    if (userIds.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Get verification status and member type
    const profileRows = await sql`
      SELECT user_id, verification_status, member_type
      FROM member_profiles
      WHERE user_id = ANY(${userIds}::varchar[])
    `;

    // Get professional details
    const detailRows = await sql`
      SELECT
        user_id,
        headline,
        bio,
        education,
        institution,
        graduation_year,
        skills,
        experience_years,
        current_company,
        job_title
      FROM member_details
      WHERE user_id = ANY(${userIds}::varchar[])
    `;

    // Create lookup maps
    const profileMap = new Map(
      profileRows.map((row) => [row.user_id, row])
    );

    const detailMap = new Map(
      detailRows.map((row) => [row.user_id, row])
    );

    // Build community members
    const members = otherMembers.map((member) => {
      const profile = profileMap.get(member.id);
      const details = detailMap.get(member.id);

      const metadata = member.unsafeMetadata as {
        city?: string;
        interests?: string;
        profession?: string;
      };

      return {
        id: member.id,

        name:
          [member.firstName, member.lastName]
            .filter(Boolean)
            .join(" ") || "Nammavaru Member",

        imageUrl: member.imageUrl,

        city: metadata.city || "Not provided",

        profession:
          details?.job_title ||
          details?.headline ||
          metadata.profession ||
          "Not provided",

        interests: metadata.interests || "",

        memberType: profile?.member_type || "member",

        verificationStatus:
          profile?.verification_status || "unverified",

        headline: details?.headline || "",
        bio: details?.bio || "",
        education: details?.education || "",
        institution: details?.institution || "",
        graduationYear: details?.graduation_year || null,
        skills: details?.skills || [],
        experienceYears: details?.experience_years ?? null,
        currentCompany: details?.current_company || "",
        jobTitle: details?.job_title || "",
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Community API error:", error);

    return NextResponse.json(
      { error: "Unable to load members" },
      { status: 500 }
    );
  }
}
