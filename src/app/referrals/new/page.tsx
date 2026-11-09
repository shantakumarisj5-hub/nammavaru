
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Member = {
  id: string;
  name: string;
  city?: string;
  profession?: string;
};

type Connection = {
  id: number;
  requester_id: string;
  receiver_id: string;
  status: string;
};

export default function NewReferralPage() {
  const { isLoaded, isSignedIn } = useUser();

  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [receiverId, setReceiverId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadConnections() {
      try {
        const response = await fetch("/api/connections");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load connections");
        }

        setMembers(data.members || []);
        setConnections(data.connections || []);
        setCurrentUserId(data.currentUserId || "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load connections"
        );
      } finally {
        setLoading(false);
      }
    }

    loadConnections();
  }, [isLoaded, isSignedIn]);

  const acceptedConnections = connections
    .filter((connection) => connection.status === "accepted")
    .map((connection) => {
      const otherUserId =
        connection.requester_id === currentUserId
          ? connection.receiver_id
          : connection.requester_id;

      const member = members.find(
        (item) => item.id === otherUserId
      );

      return member ? { ...member, connectionId: connection.id } : null;
    })
    .filter((member): member is Member & { connectionId: number } =>
      member !== null
    );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!receiverId) {
      setError("Please select a connection.");
      return;
    }

    if (!company.trim() || !role.trim() || !message.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId,
          company: company.trim(),
          role: role.trim(),
          message: message.trim(),
          resumeUrl: resumeUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not send referral request");
      }

      setSuccess("Your referral request has been sent successfully!");
      setReceiverId("");
      setCompany("");
      setRole("");
      setMessage("");
      setResumeUrl("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A0A] text-white">
        Loading your connections...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A0A] text-white">
        Please sign in to request a referral.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/referrals"
          className="text-sm text-yellow-300 hover:underline"
        >
          ← Back to Referral Center
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Grow Together
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Request a Referral
          </h1>

          <p className="mt-3 text-gray-400">
            Reach out to a trusted connection who may be able to
            refer you for an opportunity.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300">
            {success}
            <Link
              href="/referrals"
              className="ml-2 underline"
            >
              View requests
            </Link>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#191111] p-6 md:p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Select a connection *
            </label>

            <select
              value={receiverId}
              onChange={(event) => setReceiverId(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="">Choose an accepted connection</option>

              {acceptedConnections.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.profession
                    ? ` — ${member.profession}`
                    : ""}
                  {member.city ? ` (${member.city})` : ""}
                </option>
              ))}
            </select>

            {acceptedConnections.length === 0 && (
              <p className="mt-2 text-sm text-yellow-300">
                You don't have any accepted connections yet.
                <Link
                  href="/connections"
                  className="ml-1 underline"
                >
                  Find connections
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Company name *
            </label>

            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Example: Google, Infosys, TCS"
              maxLength={200}
              required
              className="w-full rounded-xl border border-white/10 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Job role *
            </label>

            <input
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Example: Software Engineer Intern"
              maxLength={200}
              required
              className="w-full rounded-xl border border-white/10 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Your message *
            </label>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Introduce yourself and explain why you are requesting this referral..."
              rows={5}
              maxLength={2000}
              required
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />

            <p className="mt-1 text-right text-xs text-gray-500">
              {message.length}/2000
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Resume link (optional)
            </label>

            <input
              type="url"
              value={resumeUrl}
              onChange={(event) => setResumeUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border border-white/10 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
            />

            <p className="mt-2 text-xs text-gray-500">
              Make sure your resume link has the correct sharing
              permissions. Only the referral participants can see it
              through this page.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              submitting || acceptedConnections.length === 0
            }
            className="w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending Request..." : "Send Referral Request"}
          </button>
        </form>
      </div>
    </main>
  );
}
