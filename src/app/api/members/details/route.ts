
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

// GET: Retrieve the logged-in user's professional details
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT *
      FROM member_details
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    return NextResponse.json({
      details: result[0] || null,
    });
  } catch (error) {
    console.error("GET member details error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve profile details." },
      { status: 500 }
    );
  }
}

// POST: Save or update the logged-in user's professional details
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block profile modifications by suspended members.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot edit your profile.",
        },
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

    const headline = String(body.headline ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const education = String(body.education ?? "").trim();
    const institution = String(body.institution ?? "").trim();
    const currentCompany = String(body.currentCompany ?? "").trim();
    const jobTitle = String(body.jobTitle ?? "").trim();

    const graduationYear =
      body.graduationYear === "" ||
      body.graduationYear === null ||
      body.graduationYear === undefined
        ? null
        : Number(body.graduationYear);

    const experienceYears =
      body.experienceYears === "" ||
      body.experienceYears === null ||
      body.experienceYears === undefined
        ? 0
        : Number(body.experienceYears);

    const skills = Array.isArray(body.skills)
      ? body.skills
          .filter((skill): skill is string => typeof skill === "string")
          .map((skill) => skill.trim())
          .filter(Boolean)
          .slice(0, 30)
      : [];

    const resumeUrl = String(body.resumeUrl ?? "").trim();
    const linkedinUrl = String(body.linkedinUrl ?? "").trim();
    const portfolioUrl = String(body.portfolioUrl ?? "").trim();

    // Field validation
    if (
      headline.length > 200 ||
      bio.length > 5000 ||
      education.length > 200 ||
      institution.length > 200 ||
      currentCompany.length > 200 ||
      jobTitle.length > 200 ||
      skills.some((skill) => skill.length > 50)
    ) {
      return NextResponse.json(
        { error: "One or more profile fields exceed the allowed length." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 60
    ) {
      return NextResponse.json(
        { error: "Experience must be between 0 and 60 years." },
        { status: 400 }
      );
    }

    if (
      graduationYear !== null &&
      (!Number.isInteger(graduationYear) ||
        graduationYear < 1950 ||
        graduationYear > 2100)
    ) {
      return NextResponse.json(
        { error: "Enter a valid graduation year." },
        { status: 400 }
      );
    }

    if (
      resumeUrl.length > 2048 ||
      linkedinUrl.length > 2048 ||
      portfolioUrl.length > 2048
    ) {
      return NextResponse.json(
        { error: "A profile URL is too long." },
        { status: 400 }
      );
    }

    if (
      (resumeUrl && !isValidUrl(resumeUrl)) ||
      (linkedinUrl && !isValidUrl(linkedinUrl)) ||
      (portfolioUrl && !isValidUrl(portfolioUrl))
    ) {
      return NextResponse.json(
        { error: "Enter valid HTTP or HTTPS URLs." },
        { status: 400 }
      );
    }

    const profile = await sql`
      SELECT user_id
      FROM member_profiles
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (profile.length === 0) {
      return NextResponse.json(
        { error: "Complete your member onboarding first." },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO member_details (
        user_id,
        headline,
        bio,
        education,
        institution,
        graduation_year,
        skills,
        experience_years,
        current_company,
        job_title,
        resume_url,
        linkedin_url,
        portfolio_url
      )
      VALUES (
        ${userId},
        ${headline || null},
        ${bio || null},
        ${education || null},
        ${institution || null},
        ${graduationYear},
        ${skills},
        ${experienceYears},
        ${currentCompany || null},
        ${jobTitle || null},
        ${resumeUrl || null},
        ${linkedinUrl || null},
        ${portfolioUrl || null}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        education = EXCLUDED.education,
        institution = EXCLUDED.institution,
        graduation_year = EXCLUDED.graduation_year,
        skills = EXCLUDED.skills,
        experience_years = EXCLUDED.experience_years,
        current_company = EXCLUDED.current_company,
        job_title = EXCLUDED.job_title,
        resume_url = EXCLUDED.resume_url,
        linkedin_url = EXCLUDED.linkedin_url,
        portfolio_url = EXCLUDED.portfolio_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return NextResponse.json({
      message: "Professional profile details saved successfully.",
      details: result[0],
    });
  } catch (error) {
    console.error("POST member details error:", error);

    return NextResponse.json(
      { error: "Failed to save profile details." },
      { status: 500 }
    );
  }
}
