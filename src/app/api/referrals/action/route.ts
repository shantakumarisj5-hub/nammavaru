
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getActiveSuspension } from "@/lib/account-status";

const sql = neon(process.env.DATABASE_URL!);

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended members from performing referral actions.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        { error: "Your account is suspended. You cannot update referrals." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { referralId, action } = body;

    const id = Number(referralId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid referral ID" },
        { status: 400 }
      );
    }

    const allowedActions = [
      "accept",
      "decline",
      "referred",
      "complete",
    ];

    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const referrals = await sql`
      SELECT *
      FROM referral_requests
      WHERE id = ${id}
      LIMIT 1
    `;

    if (referrals.length === 0) {
      return NextResponse.json(
        { error: "Referral request not found" },
        { status: 404 }
      );
    }

    const referral = referrals[0];

    // Do not allow referral actions involving a suspended member.
    const otherUserId =
      referral.requester_id === userId
        ? referral.receiver_id
        : referral.requester_id;

    const otherUserSuspension =
      await getActiveSuspension(otherUserId);

    if (otherUserSuspension) {
      return NextResponse.json(
        { error: "This referral involves a suspended member. Actions are unavailable." },
        { status: 403 }
      );
    }

    let updatedStatus = "";

    if (action === "accept" || action === "decline") {
      if (referral.receiver_id !== userId) {
        return NextResponse.json(
          { error: "Only the receiver can respond to this request" },
          { status: 403 }
        );
      }

      if (referral.status !== "requested") {
        return NextResponse.json(
          { error: "This request has already been processed" },
          { status: 409 }
        );
      }

      updatedStatus =
        action === "accept" ? "accepted" : "declined";
    }

    if (action === "referred") {
      if (referral.receiver_id !== userId) {
        return NextResponse.json(
          { error: "Only the receiver can update this referral" },
          { status: 403 }
        );
      }

      if (referral.status !== "accepted") {
        return NextResponse.json(
          { error: "Accept the request before marking it as referred" },
          { status: 409 }
        );
      }

      updatedStatus = "referred";
    }

    if (action === "complete") {
      if (referral.requester_id !== userId) {
        return NextResponse.json(
          { error: "Only the requester can complete this referral" },
          { status: 403 }
        );
      }

      if (referral.status !== "referred") {
        return NextResponse.json(
          { error: "The referral must be marked as referred first" },
          { status: 409 }
        );
      }

      updatedStatus = "completed";
    }

    const result = await sql`
      UPDATE referral_requests
      SET
        status = ${updatedStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
        AND status = ${referral.status}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Request changed. Please refresh and try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Referral status updated successfully",
      referral: result[0],
    });
  } catch (error) {
    console.error("Referral action error:", error);

    return NextResponse.json(
      { error: "Failed to update referral" },
      { status: 500 }
    );
  }
}
