
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const reasons = [
  { value: "fake_profile", label: "Fake or impersonation profile" },
  { value: "scam_or_fraud", label: "Scam or fraudulent activity" },
  { value: "harassment", label: "Harassment or inappropriate behaviour" },
  { value: "misleading_information", label: "Misleading information" },
  { value: "spam", label: "Spam or unwanted promotion" },
  { value: "other", label: "Other" },
];

export default function ReportMemberPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportedUserId: memberId,
          reason,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to submit report.");
      }

      setSuccess(true);
      setReason("");
      setDescription("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">

        <Link
          href={`/members/${encodeURIComponent(memberId)}`}
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Member Profile
        </Link>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#171010] p-6 md:p-8">

          <div className="mb-6">
            <div className="mb-4 text-4xl">🛡️</div>

            <h1 className="text-3xl font-bold">
              Report a Member
            </h1>

            <p className="mt-3 leading-7 text-gray-400">
              Help us keep Nammavaru safe and trustworthy.
              Report suspicious profiles, scams or inappropriate
              behaviour. Our moderation team will review your report.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
              <h2 className="text-xl font-bold text-green-400">
                ✓ Report Submitted
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-300">
                Thank you for helping protect the Nammavaru community.
                Your report has been submitted for review.
              </p>

              <Link
                href={`/members/${encodeURIComponent(memberId)}`}
                className="mt-6 inline-block rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300"
              >
                Return to Profile
              </Link>
            </div>
          ) : (
            <form onSubmit={submitReport} className="space-y-6">

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Why are you reporting this member?
                </label>

                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/15 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
                >
                  <option value="">Select a reason</option>

                  {reasons.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Explain what happened
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={20}
                  maxLength={1000}
                  rows={6}
                  placeholder="Please provide details that will help our moderation team investigate..."
                  className="w-full resize-y rounded-xl border border-white/15 bg-[#0F0A0A] px-4 py-3 text-white outline-none focus:border-yellow-400"
                />

                <p className="mt-2 text-right text-xs text-gray-500">
                  {description.length}/1000 characters (minimum 20)
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !reason || description.trim().length < 20}
                className="w-full rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Submitting Report..." : "Submit Report"}
              </button>

              <p className="text-center text-xs leading-5 text-gray-500">
                Please submit genuine reports. Misuse of the reporting
                system may affect your account.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
