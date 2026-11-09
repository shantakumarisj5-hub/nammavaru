
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VerificationRequest = {
  userId: string;
  name: string;
  imageUrl: string;
  email: string;
  memberType: string;
  verificationStatus: string;
  requestedAt: string;
  details: {
    headline: string | null;
    bio: string | null;
    education: string | null;
    institution: string | null;
    skills: string[];
    experienceYears: number;
    currentCompany: string | null;
    jobTitle: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
  };
};

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/verifications");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load requests.");
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function reviewRequest(
    userId: string,
    action: "approve" | "reject"
  ) {
    setActionLoading(userId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to review request.");
      }

      setMessage(data.message);
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Nammavaru Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Member Verification
            </h1>

            <p className="mt-2 text-gray-400">
              Review member profiles and make verification decisions.
            </p>
          </div>

          <button
            onClick={loadRequests}
            disabled={loading}
            className="rounded-lg border border-white/20 px-5 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <p className="text-3xl font-bold text-yellow-400">
            {requests.length}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Pending verification requests
          </p>
        </div>

        {message && (
          <p className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-gray-400">
            Loading verification requests...
          </p>
        ) : requests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#171010] p-10 text-center">
            <p className="text-xl font-semibold">
              No pending requests
            </p>
            <p className="mt-2 text-gray-400">
              New member verification requests will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {requests.map((request) => (
              <section
                key={request.userId}
                className="rounded-2xl border border-white/10 bg-[#171010] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src={request.imageUrl}
                    alt={request.name}
                    className="h-16 w-16 rounded-full border border-yellow-400 object-cover"
                  />

                  <div className="flex-1">
                    <h2 className="text-xl font-bold">
                      {request.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {request.email || "Email unavailable"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs capitalize text-yellow-400">
                        {request.memberType}
                      </span>

                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
                        Pending review
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Professional Headline
                    </p>
                    <p className="mt-1 text-gray-300">
                      {request.details.headline || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      About
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-300">
                      {request.details.bio || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Education
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      {request.details.education || "Not provided"}
                      {request.details.institution
                        ? ` — ${request.details.institution}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Experience
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      {request.details.experienceYears} years
                      {request.details.jobTitle
                        ? ` — ${request.details.jobTitle}`
                        : ""}
                      {request.details.currentCompany
                        ? ` at ${request.details.currentCompany}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-yellow-400">
                      Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {request.details.skills.length > 0 ? (
                        request.details.skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-lg bg-white/10 px-3 py-1 text-xs text-gray-300"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">
                          No skills provided
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {request.details.linkedinUrl && (
                      <a
                        href={request.details.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:underline"
                      >
                        LinkedIn ↗
                      </a>
                    )}

                    {request.details.portfolioUrl && (
                      <a
                        href={request.details.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:underline"
                      >
                        Portfolio ↗
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    Request submitted:{" "}
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                  <button
                    onClick={() =>
                      reviewRequest(request.userId, "approve")
                    }
                    disabled={actionLoading === request.userId}
                    className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === request.userId
                      ? "Processing..."
                      : "✓ Approve Verification"}
                  </button>

                  <button
                    onClick={() =>
                      reviewRequest(request.userId, "reject")
                    }
                    disabled={actionLoading === request.userId}
                    className="rounded-lg border border-red-500/40 px-6 py-3 font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
