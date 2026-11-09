
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  imageUrl: string;
  city: string;
  profession: string;
  memberType: string;
  verificationStatus: string;
  details: {
    headline: string | null;
    bio: string | null;
    education: string | null;
    institution: string | null;
    graduation_year: number | null;
    skills: string[];
    experience_years: number;
    current_company: string | null;
    job_title: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
  } | null;
};

type Connection = {
  id: number;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
};

export default function PublicMemberProfilePage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadConnections() {
    setConnectionLoading(true);

    try {
      const response = await fetch("/api/connections");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load connection status.");
      }

      setCurrentUserId(data.currentUserId || "");
      setConnections(data.connections || []);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Could not load connection status."
      );
    } finally {
      setConnectionLoading(false);
    }
  }

  useEffect(() => {
    async function loadMember() {
      try {
        const response = await fetch(
          `/api/members/${encodeURIComponent(memberId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load profile.");
        }

        setMember(data.member);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    if (memberId) {
      loadMember();
      loadConnections();
    }
  }, [memberId]);

  const connection = connections.find(
    (item) =>
      (item.requester_id === currentUserId &&
        item.receiver_id === memberId) ||
      (item.requester_id === memberId &&
        item.receiver_id === currentUserId)
  );

  const isOwnProfile = currentUserId === memberId;
  const isConnected = connection?.status === "accepted";

  const isIncomingRequest =
    connection?.status === "pending" &&
    connection.receiver_id === currentUserId;

  const isOutgoingRequest =
    connection?.status === "pending" &&
    connection.requester_id === currentUserId;

  const isRejected = connection?.status === "rejected";

  async function sendConnectionRequest() {
    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: memberId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not send connection request.");
      }

      setActionMessage("Connection request sent successfully!");
      await loadConnections();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConnectionAction(action: "accept" | "reject") {
    if (!connection) return;

    setActionLoading(true);
    setActionError("");
    setActionMessage("");

    try {
      const response = await fetch("/api/connections/action", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId: connection.id,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update connection request.");
      }

      setActionMessage(
        action === "accept"
          ? "You are now connected!"
          : "Connection request rejected."
      );

      await loadConnections();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F0A0A] flex items-center justify-center text-white">
        Loading member profile...
      </main>
    );
  }

  if (error || !member) {
    return (
      <main className="min-h-screen bg-[#0F0A0A] flex flex-col items-center justify-center gap-4 px-4 text-white">
        <h1 className="text-2xl font-bold">
          Member profile unavailable
        </h1>

        <p className="text-gray-400">
          {error || "This member profile could not be found."}
        </p>

        <Link
          href="/community"
          className="text-yellow-400 hover:underline"
        >
          ← Back to Community
        </Link>
      </main>
    );
  }

  const details = member.details;

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/community"
          className="mb-7 inline-block text-sm text-yellow-400 hover:underline"
        >
          ← Back to Community
        </Link>

        {/* Member Header */}
        <section className="rounded-2xl border border-white/10 bg-[#171010] p-6 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src={member.imageUrl}
              alt={member.name}
              className="h-24 w-24 rounded-full border-2 border-yellow-400 object-cover"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {member.name}
              </h1>

              <p className="mt-2 text-gray-400">
                {details?.headline ||
                  member.profession ||
                  "Nammavaru Community Member"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm capitalize text-yellow-400">
                  {member.memberType.replace(/_/g, " ")}
                </span>

                {member.verificationStatus === "verified" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-semibold text-blue-400">
                    <span>✓</span>
                    Verified Member
                  </span>
                )}

                {member.verificationStatus === "pending" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-medium text-yellow-400">
                    <span>◷</span>
                    Verification Pending
                  </span>
                )}

                {member.verificationStatus === "rejected" && (
                  <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-sm text-red-400">
                    Verification Not Approved
                  </span>
                )}

                {member.verificationStatus === "unverified" && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-400">
                    Not Verified
                  </span>
                )}
              </div>

              {member.city && (
                <p className="mt-3 text-sm text-gray-400">
                  📍 {member.city}
                </p>
              )}
            </div>
          </div>

          {/* Connection Actions */}
          <div className="mt-7 border-t border-white/10 pt-6">
            {connectionLoading ? (
              <p className="text-sm text-gray-400">
                Checking connection status...
              </p>
            ) : isOwnProfile ? (
              <p className="text-sm text-gray-400">
                This is your own professional profile.
              </p>
            ) : isConnected ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-3 font-semibold text-green-400">
                  ✓ Connected
                </span>

                <Link
                  href="/messages"
                  className="rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300"
                >
                  Open Messages →
                </Link>
              </div>
            ) : isOutgoingRequest ? (
              <span className="inline-block rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 font-semibold text-yellow-400">
                ◷ Request Sent — Awaiting Response
              </span>
            ) : isIncomingRequest ? (
              <div>
                <p className="mb-4 text-sm text-gray-300">
                  This member has sent you a connection request.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleConnectionAction("accept")}
                    disabled={actionLoading}
                    className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading ? "Please wait..." : "Accept Request"}
                  </button>

                  <button
                    onClick={() => handleConnectionAction("reject")}
                    disabled={actionLoading}
                    className="rounded-lg border border-red-500/40 px-6 py-3 font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : isRejected ? (
              <span className="inline-block rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-400">
                Connection request previously rejected
              </span>
            ) : (
              <button
                onClick={sendConnectionRequest}
                disabled={actionLoading}
                className="rounded-lg bg-yellow-400 px-7 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "+ Connect"}
              </button>
            )}

            {actionMessage && (
              <p className="mt-4 text-sm text-green-400">
                {actionMessage}
              </p>
            )}

            {actionError && (
              <p className="mt-4 text-sm text-red-400">
                {actionError}
              </p>
            )}
          </div>

          {/* Report Member */}
          {!isOwnProfile && !connectionLoading && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="mb-3 text-sm text-gray-400">
                See suspicious activity or misleading information?
                Help keep Nammavaru safe.
              </p>

              <Link
                href={`/report-member/${encodeURIComponent(memberId)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                <span>⚑</span>
                Report Member
              </Link>
            </div>
          )}
        </section>

        {/* About */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            About
          </h2>

          <p className="whitespace-pre-wrap leading-7 text-gray-300">
            {details?.bio || "This member has not added an introduction yet."}
          </p>
        </section>

        {/* Education */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Education
          </h2>

          {details?.education || details?.institution ? (
            <>
              <h3 className="font-semibold">
                {details.education || "Qualification not specified"}
              </h3>

              <p className="mt-1 text-gray-400">
                {details.institution || "Institution not specified"}
              </p>

              {details.graduation_year && (
                <p className="mt-2 text-sm text-gray-500">
                  Graduation year: {details.graduation_year}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400">
              Education details not added.
            </p>
          )}
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Skills
          </h2>

          {details?.skills?.length ? (
            <div className="flex flex-wrap gap-3">
              {details.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No skills added yet.</p>
          )}
        </section>

        {/* Experience */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Experience
          </h2>

          <p className="text-gray-300">
            {details?.experience_years ?? 0} years of experience
          </p>

          {(details?.job_title || details?.current_company) && (
            <div className="mt-3">
              <h3 className="font-semibold">
                {details.job_title || "Role not specified"}
              </h3>

              <p className="text-gray-400">
                {details.current_company || "Company not specified"}
              </p>
            </div>
          )}
        </section>

        {/* Professional Links */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Professional Links
          </h2>

          <div className="flex flex-col gap-3">
            {details?.linkedin_url && (
              <a
                href={details.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                LinkedIn Profile ↗
              </a>
            )}

            {details?.portfolio_url && (
              <a
                href={details.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                Portfolio / GitHub ↗
              </a>
            )}

            {!details?.linkedin_url && !details?.portfolio_url && (
              <p className="text-gray-400">
                No professional links added.
              </p>
            )}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/community"
            className="text-yellow-400 hover:underline"
          >
            Discover more members →
          </Link>
        </div>

      </div>
    </main>
  );
}
