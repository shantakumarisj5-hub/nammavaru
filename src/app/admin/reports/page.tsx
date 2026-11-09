
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Report = {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  description: string;
  status: "pending" | "reviewing" | "action_taken" | "dismissed";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  totalReports: number;
  activeReports: number;
};

const reasonLabels: Record<string, string> = {
  fake_profile: "Fake Profile",
  scam_or_fraud: "Scam or Fraud",
  harassment: "Harassment",
  misleading_information: "Misleading Information",
  spam: "Spam",
  other: "Other",
};

function statusStyle(status: Report["status"]) {
  switch (status) {
    case "pending":
      return "bg-yellow-400/10 text-yellow-300";
    case "reviewing":
      return "bg-blue-400/10 text-blue-300";
    case "action_taken":
      return "bg-green-400/10 text-green-300";
    case "dismissed":
      return "bg-gray-400/10 text-gray-300";
    default:
      return "bg-gray-400/10 text-gray-300";
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/reports");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load reports.");
      }

      setReports(data.reports || []);

      const savedNotes: Record<number, string> = {};

      for (const report of data.reports || []) {
        savedNotes[report.id] = report.admin_notes || "";
      }

      setNotes(savedNotes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function updateReport(
    reportId: number,
    status: Report["status"]
  ) {
    setUpdatingId(reportId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          status,
          adminNotes: notes[reportId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update report.");
      }

      setSuccess(`Report #${reportId} updated successfully.`);
      await loadReports();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredReports =
    filter === "all"
      ? reports
      : reports.filter((report) => report.status === filter);

  const pendingCount = reports.filter(
    (r) => r.status === "pending"
  ).length;

  const reviewingCount = reports.filter(
    (r) => r.status === "reviewing"
  ).length;

  const closedCount = reports.filter(
    (r) =>
      r.status === "action_taken" ||
      r.status === "dismissed"
  ).length;

  // Count distinct members who have received multiple reports.
  const memberReportCounts = new Map<string, number>();

  reports.forEach((report) => {
    memberReportCounts.set(
      report.reported_user_id,
      report.totalReports
    );
  });

  const repeatedMembers = Array.from(
    memberReportCounts.values()
  ).filter((count) => count >= 3).length;

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-yellow-400">
              NAMMAVARU ADMIN
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Report Moderation
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Review reports and monitor repeated reports against members.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadReports}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
            >
              Refresh
            </button>

            <Link
              href="/admin/verifications"
              className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300"
            >
              Verifications
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-yellow-300">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-400">Under Review</p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {reviewingCount}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-gray-400">Closed Reports</p>
            <p className="mt-2 text-3xl font-bold text-green-300">
              {closedCount}
            </p>
          </div>

          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
            <p className="text-sm text-gray-400">
              Repeatedly Reported Members
            </p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {repeatedMembers}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Members with 3+ reports
            </p>
          </div>

        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ["all", "All Reports"],
            ["pending", "Pending"],
            ["reviewing", "Reviewing"],
            ["action_taken", "Action Taken"],
            ["dismissed", "Dismissed"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm ${
                filter === value
                  ? "bg-yellow-400 font-semibold text-black"
                  : "border border-white/10 text-gray-300 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reports */}
        {loading ? (
          <p className="py-12 text-center text-gray-400">
            Loading reports...
          </p>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-lg font-semibold">No reports found</p>
            <p className="mt-2 text-sm text-gray-400">
              Reports matching this filter will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {filteredReports.map((report) => {
              const isClosed =
                report.status === "action_taken" ||
                report.status === "dismissed";

              const isRepeated = report.totalReports >= 3;

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
                >

                  {/* Report heading */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        REPORT #{report.id}
                      </p>

                      <h2 className="mt-1 text-lg font-bold">
                        {reasonLabels[report.reason] || report.reason}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                        report.status
                      )}`}
                    >
                      {report.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Member information */}
                  <div className="mt-5 grid gap-4 rounded-xl bg-black/20 p-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs text-gray-500">
                        Reported by
                      </p>

                      <p className="mt-1 font-medium">
                        {report.reporterName}
                      </p>

                      <p className="break-all text-xs text-gray-500">
                        {report.reporter_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Reported member
                      </p>

                      <p className="mt-1 font-medium">
                        {report.reportedName}
                      </p>

                      <p className="break-all text-xs text-gray-500">
                        {report.reported_user_id}
                      </p>

                      <Link
                        href={`/members/${encodeURIComponent(
                          report.reported_user_id
                        )}`}
                        className="mt-2 inline-block text-xs text-yellow-400 hover:underline"
                      >
                        View member profile
                      </Link>
                    </div>

                  </div>

                  {/* Repeat offender information */}
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div>
                        <p className="text-sm font-semibold">
                          Member Report History
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Total reports received: {report.totalReports}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Active reports: {report.activeReports}
                        </p>
                      </div>

                      {isRepeated ? (
                        <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-400">
                          ⚠ Multiple Reports
                        </span>
                      ) : (
                        <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs text-green-400">
                          Below Report Threshold
                        </span>
                      )}

                    </div>

                    {isRepeated && (
                      <p className="mt-3 text-xs leading-5 text-red-300">
                        This member has received 3 or more reports.
                        Review the report history carefully before taking action.
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mt-5">
                    <p className="text-xs text-gray-500">
                      Report Description
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-200">
                      {report.description}
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    Submitted: {new Date(report.created_at).toLocaleString()}
                  </p>

                  {/* Admin notes */}
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium">
                      Admin Notes
                    </label>

                    <textarea
                      value={notes[report.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [report.id]: e.target.value,
                        }))
                      }
                      disabled={isClosed}
                      maxLength={2000}
                      rows={3}
                      placeholder="Write your review notes..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-yellow-400 disabled:opacity-50"
                    />
                  </div>

                  {/* Admin actions */}
                  {isClosed ? (
                    <p className="mt-4 text-sm text-gray-400">
                      This report has been closed.
                      {report.reviewed_at &&
                        ` Reviewed: ${new Date(
                          report.reviewed_at
                        ).toLocaleString()}`}
                    </p>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-3">

                      <button
                        disabled={updatingId === report.id}
                        onClick={() =>
                          updateReport(report.id, "reviewing")
                        }
                        className="rounded-lg border border-blue-400/30 px-4 py-2 text-sm text-blue-300 hover:bg-blue-400/10 disabled:opacity-50"
                      >
                        {updatingId === report.id
                          ? "Updating..."
                          : "Mark Reviewing"}
                      </button>

                      <button
                        disabled={updatingId === report.id}
                        onClick={() =>
                          updateReport(report.id, "action_taken")
                        }
                        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400 disabled:opacity-50"
                      >
                        Action Taken
                      </button>

                      <button
                        disabled={updatingId === report.id}
                        onClick={() =>
                          updateReport(report.id, "dismissed")
                        }
                        className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
                      >
                        Dismiss Report
                      </button>

                    </div>
                  )}

                </article>
              );
            })}

          </div>
        )}
      </div>
    </main>
  );
}
