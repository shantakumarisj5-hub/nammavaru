
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Prevent suspended members from liking posts
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot like posts.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = Number(body.postId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    // Check whether the post exists
    const post = await sql`
      SELECT id
      FROM community_posts
      WHERE id = ${id}
    `;

    if (post.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const existing = await sql`
      SELECT id
      FROM post_likes
      WHERE post_id = ${id}
        AND user_id = ${userId}
    `;

    if (existing.length > 0) {
      await sql`
        DELETE FROM post_likes
        WHERE post_id = ${id}
          AND user_id = ${userId}
      `;
    } else {
      await sql`
        INSERT INTO post_likes (post_id, user_id)
        VALUES (${id}, ${userId})
        ON CONFLICT (post_id, user_id) DO NOTHING
      `;
    }

    const count = await sql`
      SELECT COUNT(*)::int AS like_count
      FROM post_likes
      WHERE post_id = ${id}
    `;

    return NextResponse.json({
      isLiked: existing.length === 0,
      likeCount: count[0].like_count,
    });
  } catch (error) {
    console.error("Like post error:", error);

    return NextResponse.json(
      { error: "Unable to update like" },
      { status: 500 }
    );
  }
}
