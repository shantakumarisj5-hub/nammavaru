
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

const allowedCategories = [
  "General",
  "Achievement",
  "Question",
  "Technology",
  "Career",
  "Culture",
];

// GET: Fetch community posts
export async function GET() {
  try {
    const { userId } = await auth();

    const posts = await sql`
      SELECT
        p.id,
        p.user_id,
        p.author_name,
        p.content,
        p.category,
        p.created_at,
        COUNT(DISTINCT pl.id)::int AS like_count,
        EXISTS (
          SELECT 1
          FROM post_likes user_like
          WHERE user_like.post_id = p.id
          AND user_like.user_id = ${userId || ""}
        ) AS is_liked
      FROM community_posts p
      LEFT JOIN post_likes pl
        ON pl.post_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    return NextResponse.json({
      posts,
      currentUserId: userId || "",
    });
  } catch (error) {
    console.error("GET posts error:", error);

    return NextResponse.json(
      { error: "Unable to load community posts" },
      { status: 500 }
    );
  }
}

// POST: Create a community post
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to create a post" },
        { status: 401 }
      );
    }

    // Check whether the account is suspended
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot create posts.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const category =
      typeof body.category === "string" ? body.category : "General";

    if (!content) {
      return NextResponse.json(
        { error: "Post content cannot be empty" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Post cannot exceed 2000 characters" },
        { status: 400 }
      );
    }

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "Please select a valid category" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const authorName =
      user.fullName ||
      user.username ||
      user.firstName ||
      "Community Member";

    const result = await sql`
      INSERT INTO community_posts (
        user_id,
        author_name,
        content,
        category
      )
      VALUES (
        ${userId},
        ${authorName},
        ${content},
        ${category}
      )
      RETURNING
        id,
        user_id,
        author_name,
        content,
        category,
        created_at
    `;

    const post = {
      ...result[0],
      like_count: 0,
      is_liked: false,
    };

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST create post error:", error);

    return NextResponse.json(
      { error: "Unable to create post" },
      { status: 500 }
    );
  }
}
