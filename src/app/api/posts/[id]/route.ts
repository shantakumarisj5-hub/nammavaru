
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedCategories = [
  "General",
  "Achievement",
  "Question",
  "Technology",
  "Career",
  "Culture",
];

// PATCH: Edit your own post
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Check account suspension
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot edit posts.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = Number(id);
    const body = await request.json();

    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const category =
      typeof body.category === "string"
        ? body.category
        : "General";

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    if (!content || content.length > 2000) {
      return NextResponse.json(
        { error: "Post must contain 1 to 2000 characters" },
        { status: 400 }
      );
    }

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE community_posts
      SET content = ${content},
          category = ${category}
      WHERE id = ${postId}
        AND user_id = ${userId}
      RETURNING
        id,
        user_id,
        author_name,
        content,
        category,
        created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Post not found or you cannot edit it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: result[0] });
  } catch (error) {
    console.error("Edit post error:", error);

    return NextResponse.json(
      { error: "Unable to update post" },
      { status: 500 }
    );
  }
}

// DELETE: Delete your own post
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    // Check account suspension
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        {
          error: "Your account is suspended. You cannot delete posts.",
          suspended: true,
          reason: suspension.reason,
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = Number(id);

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await sql`
      DELETE FROM community_posts
      WHERE id = ${postId}
        AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Post not found or you cannot delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);

    return NextResponse.json(
      { error: "Unable to delete post" },
      { status: 500 }
    );
  }
}
