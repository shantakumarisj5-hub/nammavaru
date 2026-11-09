
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Fetch available mentors
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Reading mentor profiles is allowed.
    const profiles = await sql`
      SELECT
        user_id,
        headline,
        expertise,
        experience_years,
        bio,
        is_available,
        created_at
      FROM mentor_profiles
      WHERE is_available = TRUE
      ORDER BY created_at DESC
    `;

    const client = await clerkClient();

    const mentors = await Promise.all(
      profiles.map(async (profile) => {
        try {
          const user = await client.users.getUser(profile.user_id);

          return {
            ...profile,
            name: [user.firstName, user.lastName]
              .filter(Boolean)
              .join(" ") || "Nammavaru Member",
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error("Failed to load mentor:", error);
          return null;
        }
      })
    );

    return NextResponse.json({
      mentors: mentors.filter((mentor) => mentor !== null),
      currentUserId: userId,
    });
  } catch (error) {
    console.error("GET mentors error:", error);

    return NextResponse.json(
      { error: "Failed to load mentors" },
      { status: 500 }
    );
  }
}

// POST: Register or update mentor profile
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Suspended members cannot register or update mentor profiles.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot update your mentor profile.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const headline = String(body.headline || "").trim();
    const expertise = String(body.expertise || "").trim();
    const bio = String(body.bio || "").trim();
    const experienceYears = Number(body.experienceYears);

    if (!headline || !expertise || !bio) {
      return NextResponse.json(
        { error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 60
    ) {
      return NextResponse.json(
        { error: "Enter valid years of experience" },
        { status: 400 }
      );
    }

    if (
      headline.length > 200 ||
      expertise.length > 500 ||
      bio.length > 2000
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO mentor_profiles (
        user_id,
        headline,
        expertise,
        experience_years,
        bio,
        is_available
      )
      VALUES (
        ${userId},
        ${headline},
        ${expertise},
        ${experienceYears},
        ${bio},
        TRUE
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        headline = EXCLUDED.headline,
        expertise = EXCLUDED.expertise,
        experience_years = EXCLUDED.experience_years,
        bio = EXCLUDED.bio,
        is_available = TRUE,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({
      success: true,
      message: "Mentor profile saved successfully",
    });
  } catch (error) {
    console.error("POST mentor profile error:", error);

    return NextResponse.json(
      { error: "Failed to save mentor profile" },
      { status: 500 }
    );
  }
}
