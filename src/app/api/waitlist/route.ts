
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "").trim();
    const city = String(body.city ?? "").trim();

    // Required fields
    if (!fullName || !email || !role || !city) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Length validation
    if (
      fullName.length > 100 ||
      email.length > 254 ||
      role.length > 50 ||
      city.length > 100
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Prevent duplicate email registrations
    const existing = await sql`
      SELECT id
      FROM waitlist
      WHERE LOWER(email) = ${email}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "This email is already registered!" },
        { status: 409 }
      );
    }

    await sql`
      INSERT INTO waitlist (full_name, email, role, city)
      VALUES (${fullName}, ${email}, ${role}, ${city})
    `;

    return NextResponse.json(
      { success: true, message: "Successfully joined the waitlist!" },
      { status: 201 }
    );
  } catch (error) {
    const dbError = error as { code?: string };

    // Handle simultaneous duplicate submissions.
    if (dbError.code === "23505") {
      return NextResponse.json(
        { error: "This email is already registered!" },
        { status: 409 }
      );
    }

    console.error("WAITLIST ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
