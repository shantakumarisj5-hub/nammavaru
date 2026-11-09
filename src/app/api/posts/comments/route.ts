
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

// GET: Fetch comments
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = Number(searchParams.get("postId"));

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const comments = await sql`
      SELECT
        id,
        post_id,
        user_id,
        author_name,
        content,
        created_at
      FROM post_comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({
      comments,
      currentUserId: userId,
    });
  } catch (error) {
    console.error("Fetch comments error:", error);

    return NextResponse.json(
      { error: "Unable to fetch comments" },
      { status: 500 }
    );
  }
}

// POST: Create a comment
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Prevent suspended members from commenting
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot comment.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const postId = Number(body.postId);
    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    if (!content || content.length > 1000) {
      return NextResponse.json(
        { error: "Comment must contain 1 to 1000 characters" },
        { status: 400 }
      );
    }

    const post = await sql`
      SELECT id
      FROM community_posts
      WHERE id = ${postId}
    `;

    if (post.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const authorName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      "Nammavaru Member";

    const result = await sql`
      INSERT INTO post_comments (
        post_id,
        user_id,
        author_name,
        content
      )
      VALUES (
        ${postId},
        ${userId},
        ${authorName},
        ${content}
      )
      RETURNING
        id,
        post_id,
        user_id,
        author_name,
        content,
        created_at
    `;

    return NextResponse.json(
      { comment: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);

    return NextResponse.json(
      { error: "Unable to create comment" },
      { status: 500 }
    );
  }
}

// DELETE: Delete your own comment
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Prevent suspended members from deleting comments
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot delete comments.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const commentId = Number(body.commentId);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return NextResponse.json(
        { error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM post_comments
      WHERE id = ${commentId}
        AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Comment not found or you cannot delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);

    return NextResponse.json(
      { error: "Unable to delete comment" },
      { status: 500 }
    );
  }
}
