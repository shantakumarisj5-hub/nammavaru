
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Referral = {
  id: number;
  requester_id: string;
  receiver_id: string;
  other_user_id: string;
  other_user_name: string;
  direction: "sent" | "received";
  company: string;
  role: string;
  message: string;
  resume_url: string | null;
  status: string;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  requested: "bg-yellow-400/10 text-yellow-300",
  accepted: "bg-blue-400/10 text-blue-300",
  declined: "bg-red-400/10 text-red-300",
  referred: "bg-purple-400/10 text-purple-300",
  completed: "bg-green-400/10 text-green-300",
};

export default function ReferralsPage() {
  const { isLoaded, isSignedIn } = useUser();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchReferrals() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/referrals");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load referrals");
      }

      setReferrals(data.referrals || []);
      setCurrentUserId(data.currentUserId || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchReferrals();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  async function updateReferral(
    referralId: number,
    action: string
  ) {
    try {
      setUpdatingId(referralId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/referrals/action", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralId,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update referral");
      }

      setSuccess(data.message || "Referral updated successfully");
      await fetchReferrals();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const incoming = referrals.filter(
    (item) => item.direction === "received"
  );

  const sent = referrals.filter(
    (item) => item.direction === "sent"
  );

  function ReferralCard({ item }: { item: Referral }) {
    const isReceiver = item.receiver_id === currentUserId;
    const isRequester = item.requester_id === currentUserId;
    const isUpdating = updatingId === item.id;

    return (
      <div className="rounded-2xl border border-white/10 bg-[#191111] p-5 transition hover:border-yellow-400/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400">
              {isReceiver ? "Request from" : "Request to"}
            </p>

            <h3 className="mt-1 text-lg font-semibold text-white">
              {item.other_user_name || "Nammavaru Member"}
            </h3>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              statusStyles[item.status] ||
              "bg-gray-500/10 text-gray-300"
            }`}
          >
            {item.status}
          </span>
        </div>

        <div className="mt-5 space-y-2">
          <p className="text-sm text-gray-400">Company</p>
          <p className="font-medium text-yellow-300">
            {item.company}
          </p>

          <p className="pt-2 text-sm text-gray-400">Position</p>
          <p className="font-medium text-white">{item.role}</p>

          <p className="pt-2 text-sm text-gray-400">Message</p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
            {item.message}
          </p>
        </div>

        {item.resume_url && (
          <a
            href={item.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-yellow-300 underline"
          >
            View Resume
          </a>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Requested on{" "}
          {new Date(item.created_at).toLocaleDateString()}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {isReceiver && item.status === "requested" && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => updateReferral(item.id, "accept")}
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Accept"}
              </button>

              <button
                disabled={isUpdating}
                onClick={() => updateReferral(item.id, "decline")}
                className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}

          {isReceiver && item.status === "accepted" && (
            <button
              disabled={isUpdating}
              onClick={() => updateReferral(item.id, "referred")}
              className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Mark as Referred"}
            </button>
          )}

          {isRequester && item.status === "referred" && (
            <button
              disabled={isUpdating}
              onClick={() => updateReferral(item.id, "complete")}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Mark as Completed"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A0A] text-white">
        Loading referrals...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A0A] text-white">
        Please sign in to view referrals.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-300 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
              Nammavaru Network
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Referral Center
            </h1>

            <p className="mt-2 max-w-2xl text-gray-400">
              Help your connections discover opportunities and grow
              together.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/referrals/new"
              className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
            >
              + Request a Referral
            </Link>

            <button
              onClick={fetchReferrals}
              className="rounded-xl border border-white/15 px-4 py-3 text-sm hover:border-yellow-400 hover:text-yellow-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#191111] p-5">
            <p className="text-sm text-gray-400">Total Requests</p>
            <p className="mt-2 text-3xl font-bold">
              {referrals.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#191111] p-5">
            <p className="text-sm text-gray-400">Incoming</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {incoming.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#191111] p-5">
            <p className="text-sm text-gray-400">Sent</p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {sent.length}
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              Incoming Requests
            </h2>

            <span className="text-sm text-gray-400">
              {incoming.length} requests
            </span>
          </div>

          {incoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
              <p className="text-gray-300">
                No incoming referral requests yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Requests from your connections will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {incoming.map((item) => (
                <ReferralCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sent Requests</h2>

            <span className="text-sm text-gray-400">
              {sent.length} requests
            </span>
          </div>

          {sent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
              <p className="text-gray-300">
                You haven't sent any referral requests yet.
              </p>

              <p className="mt-2 text-sm text-gray-500">
                You can request referrals from your accepted connections.
              </p>

              <Link
                href="/referrals/new"
                className="mt-4 inline-block text-sm font-semibold text-yellow-300 hover:underline"
              >
                Send your first request →
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {sent.map((item) => (
                <ReferralCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-6">
          <h3 className="font-bold text-yellow-300">
            Grow Together 🤝
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            A referral is more than an introduction. It is an
            opportunity to help someone in your community take their
            next career step.
          </p>
        </div>
      </div>
    </main>
  );
}
