
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getActiveSuspension } from "@/lib/account-status";

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

    // Reading existing referrals is allowed.
    const referrals = await sql`
      SELECT
        *,
        CASE
          WHEN requester_id = ${userId}
          THEN receiver_id
          ELSE requester_id
        END AS other_user_id
      FROM referral_requests
      WHERE requester_id = ${userId}
         OR receiver_id = ${userId}
      ORDER BY created_at DESC
    `;

    const client = await clerkClient();

    const otherUserIds = [
      ...new Set(referrals.map((item: any) => item.other_user_id)),
    ];

    const names: Record<string, string> = {};

    await Promise.all(
      otherUserIds.map(async (id) => {
        try {
          const user = await client.users.getUser(id);

          names[id] =
            user.fullName ||
            user.username ||
            user.firstName ||
            "Nammavaru Member";
        } catch {
          names[id] = "Nammavaru Member";
        }
      })
    );

    const formattedReferrals = referrals.map((item: any) => ({
      ...item,
      other_user_name: names[item.other_user_id],
      direction:
        item.requester_id === userId ? "sent" : "received",
    }));

    return NextResponse.json({
      referrals: formattedReferrals,
      currentUserId: userId,
    });
  } catch (error) {
    console.error("Fetch referrals error:", error);

    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Block suspended requesters.
    const suspension = await getActiveSuspension(userId);

    if (suspension) {
      return NextResponse.json(
        { error: "Your account is suspended. You cannot send referral requests." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      receiverId,
      opportunityId,
      company,
      role,
      message,
      resumeUrl,
    } = body;

    if (
      typeof receiverId !== "string" ||
      !receiverId.trim() ||
      receiverId === userId
    ) {
      return NextResponse.json(
        { error: "Invalid receiver" },
        { status: 400 }
      );
    }

    if (
      typeof company !== "string" ||
      typeof role !== "string" ||
      typeof message !== "string" ||
      !company.trim() ||
      !role.trim() ||
      !message.trim()
    ) {
      return NextResponse.json(
        { error: "Company, role and message are required" },
        { status: 400 }
      );
    }

    if (
      company.length > 200 ||
      role.length > 200 ||
      message.length > 2000
    ) {
      return NextResponse.json(
        { error: "One or more fields are too long" },
        { status: 400 }
      );
    }

    if (resumeUrl !== undefined && resumeUrl !== null && resumeUrl !== "") {
      if (typeof resumeUrl !== "string") {
        return NextResponse.json(
          { error: "Please provide a valid resume URL" },
          { status: 400 }
        );
      }

      try {
        const parsedUrl = new URL(resumeUrl);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        return NextResponse.json(
          { error: "Please provide a valid resume URL" },
          { status: 400 }
        );
      }
    }

    // Block requests to suspended members.
    const receiverSuspension = await getActiveSuspension(receiverId);

    if (receiverSuspension) {
      return NextResponse.json(
        { error: "You cannot send a referral request to this member." },
        { status: 403 }
      );
    }

    let validOpportunityId: number | null = null;

    if (
      opportunityId !== undefined &&
      opportunityId !== null &&
      opportunityId !== ""
    ) {
      validOpportunityId = Number(opportunityId);

      if (
        !Number.isInteger(validOpportunityId) ||
        validOpportunityId <= 0
      ) {
        return NextResponse.json(
          { error: "Invalid opportunity ID" },
          { status: 400 }
        );
      }

      const opportunity = await sql`
        SELECT id
        FROM opportunities
        WHERE id = ${validOpportunityId}
      `;

      if (opportunity.length === 0) {
        return NextResponse.json(
          { error: "Opportunity not found" },
          { status: 404 }
        );
      }
    }

    // Only accepted connections can exchange referral requests.
    const connection = await sql`
      SELECT id
      FROM member_connections
      WHERE status = 'accepted'
        AND (
          (requester_id = ${userId} AND receiver_id = ${receiverId})
          OR
          (requester_id = ${receiverId} AND receiver_id = ${userId})
        )
      LIMIT 1
    `;

    if (connection.length === 0) {
      return NextResponse.json(
        { error: "You can request referrals only from accepted connections" },
        { status: 403 }
      );
    }

    // Prevent duplicate pending requests.
    const existing = await sql`
      SELECT id
      FROM referral_requests
      WHERE requester_id = ${userId}
        AND receiver_id = ${receiverId}
        AND status = 'requested'
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending request with this member" },
        { status: 409 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const requesterName =
      user.fullName ||
      user.username ||
      user.firstName ||
      "Nammavaru Member";

    const result = await sql`
      INSERT INTO referral_requests (
        opportunity_id,
        requester_id,
        receiver_id,
        company,
        role,
        message,
        resume_url
      )
      VALUES (
        ${validOpportunityId},
        ${userId},
        ${receiverId},
        ${company.trim()},
        ${role.trim()},
        ${message.trim()},
        ${resumeUrl?.trim() || null}
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        message: "Referral request sent successfully",
        referral: {
          ...result[0],
          requester_name: requesterName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create referral error:", error);

    return NextResponse.json(
      { error: "Failed to send referral request" },
      { status: 500 }
    );
  }
}
