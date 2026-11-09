
    
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  city: string;
  profession: string;
  interests: string[];
};

type Connection = {
  id: number;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type ConnectionData = {
  members: Member[];
  connections: Connection[];
};

export default function ConnectionsPage() {
  const [data, setData] = useState<ConnectionData>({
    members: [],
    connections: [],
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/connections");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load connections");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load connections"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  async function sendRequest(receiverId: string) {
    setBusyId(receiverId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send request");
      }

      setMessage("Connection request sent successfully!");
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRequest(
    connectionId: number,
    action: "accept" | "reject"
  ) {
    setBusyId(connectionId);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/connections/action", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update request");
      }

      setMessage(result.message);
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const incoming = data.connections.filter(
    (item) => item.receiver_id && item.status === "pending"
  );

  const outgoing = data.connections.filter(
    (item) => item.requester_id && item.status === "pending"
  );

  const accepted = data.connections.filter(
    (item) => item.status === "accepted"
  );

  const getOtherMemberId = (connection: Connection) => {
    // The current member is either the requester or receiver.
    // Incoming/outgoing lists determine the direction below.
    return connection.requester_id;
  };

  const getMember = (id: string) =>
    data.members.find((member) => member.id === id);

  const filteredMembers = data.members.filter((member) => {
    const query = search.toLowerCase();

    return (
      member.name.toLowerCase().includes(query) ||
      member.city.toLowerCase().includes(query) ||
      member.profession.toLowerCase().includes(query) ||
      member.interests.some((interest) =>
        String(interest).toLowerCase().includes(query)
      )
    );
  });

  const connectedIds = new Set(
    accepted.map((item) =>
      item.requester_id === item.receiver_id
        ? item.requester_id
        : item.requester_id
    )
  );

  const pendingMemberIds = new Set(
    data.connections
      .filter((item) => item.status === "pending")
      .flatMap((item) => [item.requester_id, item.receiver_id])
  );

  const cardClass =
    "rounded-2xl border border-white/10 bg-[#171010] p-5";

  const actionClass =
    "rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50";

  function SectionTitle({
    title,
    count,
  }: {
    title: string;
    count: number;
  }) {
    return (
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm text-yellow-400">
          {count}
        </span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Nammavaru Network
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            My Connections
          </h1>
          <p className="mt-3 text-gray-400">
            Build meaningful connections with members of our community.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-gray-400">
            Loading your network...
          </p>
        ) : (
          <>
            <section className="mb-10 grid gap-4 sm:grid-cols-3">
              <div className={cardClass}>
                <p className="text-sm text-gray-400">Total members</p>
                <p className="mt-2 text-3xl font-bold">{data.members.length}</p>
              </div>
              <div className={cardClass}>
                <p className="text-sm text-gray-400">My connections</p>
                <p className="mt-2 text-3xl font-bold">{accepted.length}</p>
              </div>
              <div className={cardClass}>
                <p className="text-sm text-gray-400">Incoming requests</p>
                <p className="mt-2 text-3xl font-bold">{incoming.length}</p>
              </div>
            </section>

            <section className="mb-10">
              <SectionTitle title="Incoming Requests" count={incoming.length} />

              {incoming.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You don't have any new connection requests.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {incoming.map((request) => {
                    const member = getMember(request.requester_id);

                    return (
                      <div key={request.id} className={cardClass}>
                        <h3 className="font-bold">
                          {member?.name || "Nammavaru Member"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                          {member?.profession || "Community member"}
                          {member?.city ? ` · ${member.city}` : ""}
                        </p>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => handleRequest(request.id, "accept")}
                            disabled={busyId === request.id}
                            className={actionClass}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequest(request.id, "reject")}
                            disabled={busyId === request.id}
                            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-red-400 hover:text-red-300 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mb-10">
              <SectionTitle title="My Connections" count={accepted.length} />

              {accepted.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven't connected with anyone yet.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {accepted.map((connection) => {
                    const memberId = getOtherMemberId(connection);
                    const member = getMember(memberId);

                    return (
                      <div key={connection.id} className={cardClass}>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-bold">
                            {member?.name || "Connected member"}
                          </h3>
                          <span className="text-xs text-green-400">
                            Connected
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                          {member?.profession || "Community member"}
                          {member?.city ? ` · ${member.city}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mb-10">
              <SectionTitle title="Sent Requests" count={outgoing.length} />
              {outgoing.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You haven't sent any pending requests.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {outgoing.map((request) => {
                    const member = getMember(request.receiver_id);

                    return (
                      <div key={request.id} className={cardClass}>
                        <h3 className="font-bold">
                          {member?.name || "Nammavaru Member"}
                        </h3>
                        <p className="mt-2 text-sm text-yellow-400">
                          Request pending
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <SectionTitle
                title="Discover Members"
                count={filteredMembers.length}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, city, profession or interest..."
                className="mb-6 w-full rounded-xl border border-white/10 bg-[#191111] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400"
              />

              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No matching members found.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMembers.map((member) => {
                    const connection = data.connections.find(
                      (item) =>
                        (item.requester_id === member.id ||
                          item.receiver_id === member.id) &&
                        item.status !== "rejected"
                    );

                    let buttonLabel = "Connect";
                    let disabled = false;

                    if (connection?.status === "accepted") {
                      buttonLabel = "Connected";
                      disabled = true;
                    } else if (connection?.status === "pending") {
                      buttonLabel =
                        connection.requester_id === member.id
                          ? "Respond to request above"
                          : "Request sent";
                      disabled = true;
                    }

                    return (
                      <article key={member.id} className={cardClass}>
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-yellow-400/10 text-xl font-bold text-yellow-400">
                          {member.name.charAt(0).toUpperCase()}
                        </div>

                        <h3 className="text-lg font-bold">{member.name}</h3>
                        <p className="mt-1 text-sm text-gray-400">
                          {member.profession || "Community member"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {member.city || "City not added"}
                        </p>

                        {member.interests.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {member.interests.slice(0, 4).map((interest, i) => (
                              <span
                                key={`${member.id}-${i}`}
                                className="rounded-full bg-white/5 px-2 py-1 text-xs text-gray-300"
                              >
                                {String(interest)}
                              </span>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() => sendRequest(member.id)}
                          disabled={disabled || busyId === member.id}
                          className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            disabled
                              ? "border border-white/10 text-gray-400"
                              : "bg-yellow-400 text-black hover:bg-yellow-300"
                          }`}
                        >
                          {busyId === member.id ? "Sending..." : buttonLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
