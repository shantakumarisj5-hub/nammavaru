
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MentorshipRequest {
  id: number;
  mentor_id: string;
  requester_id: string;
  message: string;
  goals: string | null;
  status: "pending" | "accepted" | "declined" | "completed";
  created_at: string;
  other_user_id: string;
  other_user_name: string;
  direction: "sent" | "received";
}

export default function MentorshipRequestsPage() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/mentorship/requests");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load requests");
      }

      setRequests(data.requests || []);
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
    loadRequests();
  }, []);

  async function updateRequest(
    requestId: number,
    action: "accept" | "decline" | "complete"
  ) {
    try {
      setUpdatingId(requestId);
      setError("");

      const response = await fetch("/api/mentorship/requests/action", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update request");
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const sentRequests = requests.filter(
    (request) => request.direction === "sent"
  );

  const receivedRequests = requests.filter(
    (request) => request.direction === "received"
  );

  const filteredRequests = requests.filter((request) => {
    if (filter === "sent") return request.direction === "sent";
    if (filter === "received") return request.direction === "received";
    if (filter === "pending") return request.status === "pending";
    if (filter === "accepted") return request.status === "accepted";
    if (filter === "completed") return request.status === "completed";
    return true;
  });

  function statusStyle(status: string) {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "declined":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white px-5 py-10">
      <div className="max-w-6xl mx-auto">

        <Link
          href="/mentorship"
          className="text-yellow-400 text-sm hover:text-yellow-300"
        >
          ← Back to Mentorship
        </Link>

        <div className="mt-7 mb-9">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">
            Nammavaru Mentorship
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-3">
            My Mentorship Requests
          </h1>

          <p className="text-gray-400 mt-3">
            Manage your mentorship connections and track your progress.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Requests", value: requests.length },
            { label: "Sent", value: sentRequests.length },
            { label: "Received", value: receivedRequests.length },
            {
              label: "Active",
              value: requests.filter((r) => r.status === "accepted").length,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#191111] border border-white/10 rounded-xl p-5"
            >
              <p className="text-gray-400 text-sm">{item.label}</p>
              <p className="text-2xl font-bold text-yellow-400 mt-2">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-7">
          {[
            ["all", "All"],
            ["sent", "Sent"],
            ["received", "Received"],
            ["pending", "Pending"],
            ["accepted", "Accepted"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === value
                  ? "bg-yellow-400 text-black"
                  : "bg-[#191111] border border-white/10 text-gray-300 hover:border-yellow-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            Loading mentorship requests...
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredRequests.length === 0 && (
          <div className="bg-[#191111] border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-5">🤝</div>

            <h2 className="text-xl font-bold">
              No mentorship requests found
            </h2>

            <p className="text-gray-400 mt-3">
              Your mentorship requests will appear here.
            </p>

            <Link
              href="/mentorship"
              className="inline-block mt-6 bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl"
            >
              Explore Mentors
            </Link>
          </div>
        )}

        {/* Request cards */}
        {!loading && filteredRequests.length > 0 && (
          <div className="space-y-5">
            {filteredRequests.map((request) => {
              const isReceived = request.direction === "received";
              const isMentor = request.mentor_id === currentUserId;

              return (
                <div
                  key={request.id}
                  className="bg-[#191111] border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">
                        {isReceived ? "Request received from" : "Request sent to"}
                      </p>

                      <h3 className="text-xl font-bold mt-2">
                        {request.other_user_name}
                      </h3>

                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-semibold capitalize ${statusStyle(request.status)}`}
                      >
                        {request.status}
                      </span>

                      <span className="text-gray-500 text-xs">
                        {isReceived ? "Incoming" : "Outgoing"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 bg-[#0F0A0A] rounded-xl p-4">
                    <p className="text-gray-500 text-xs uppercase mb-2">
                      Mentorship Message
                    </p>

                    <p className="text-gray-300 text-sm leading-6 whitespace-pre-wrap">
                      {request.message}
                    </p>

                    {request.goals && (
                      <>
                        <p className="text-gray-500 text-xs uppercase mt-5 mb-2">
                          Learning Goals
                        </p>

                        <p className="text-gray-300 text-sm leading-6 whitespace-pre-wrap">
                          {request.goals}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Mentor actions */}
                  {isReceived && isMentor && (
                    <div className="flex flex-wrap gap-3 mt-5">

                      {request.status === "pending" && (
                        <>
                          <button
                            disabled={updatingId === request.id}
                            onClick={() =>
                              updateRequest(request.id, "accept")
                            }
                            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold px-5 py-2.5 rounded-lg"
                          >
                            Accept
                          </button>

                          <button
                            disabled={updatingId === request.id}
                            onClick={() =>
                              updateRequest(request.id, "decline")
                            }
                            className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 px-5 py-2.5 rounded-lg"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {request.status === "accepted" && (
                        <button
                          disabled={updatingId === request.id}
                          onClick={() =>
                            updateRequest(request.id, "complete")
                          }
                          className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg"
                        >
                          Mark as Completed
                        </button>
                      )}

                    </div>
                  )}

                  {updatingId === request.id && (
                    <p className="text-yellow-400 text-sm mt-3">
                      Updating request...
                    </p>
                  )}

                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={loadRequests}
            className="border border-white/20 hover:border-yellow-400 px-5 py-3 rounded-xl"
          >
            Refresh Requests
          </button>

          <Link
            href="/mentorship"
            className="bg-yellow-400 text-black font-semibold px-5 py-3 rounded-xl"
          >
            Find More Mentors
          </Link>
        </div>

      </div>
    </main>
  );
}
