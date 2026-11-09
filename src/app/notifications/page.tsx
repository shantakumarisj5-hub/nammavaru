
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: "connection" | "message";
  title: string;
  description: string;
  created_at: string;
  href: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);

      setError("");

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load notifications");
      }

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setRequestCount(data.requestCount || 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Back button */}
        <Link
          href="/dashboard"
          className="text-sm font-medium text-yellow-400 transition hover:text-yellow-300"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest text-yellow-400">
              STAY CONNECTED
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Notifications
              <span className="text-yellow-400">.</span>
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Your latest community activities and updates.
            </p>
          </div>

          <button
            onClick={() => loadNotifications(true)}
            disabled={refreshing}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:border-yellow-400 hover:bg-white/10 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#191111] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Unread Messages
              </p>
              <span className="text-2xl">💬</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-yellow-400">
              {unreadCount}
            </h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#191111] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Pending Requests
              </p>
              <span className="text-2xl">🤝</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-yellow-400">
              {requestCount}
            </h2>
          </div>
        </div>

        {/* Notifications list */}
        <div className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Recent Activity
            </h2>

            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
              {notifications.length} notifications
            </span>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[#191111] p-12 text-center text-gray-400">
              Loading your notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#191111] px-6 py-16 text-center">
              <div className="text-6xl">🔔</div>

              <h3 className="mt-5 text-xl font-bold">
                You're all caught up!
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
                You don't have any new notifications right now.
                New connection requests and messages will appear here.
              </p>

              <Link
                href="/community"
                className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                Explore Community →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-white/10 bg-[#191111] p-5 transition hover:border-yellow-400/40 hover:bg-[#211717]"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {/* Icon */}
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-2xl">
                      {item.type === "connection" ? "🤝" : "💬"}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">
                          {item.title}
                        </h3>

                        <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                          {item.type}
                        </span>
                      </div>

                      <p className="mt-2 break-words text-sm leading-6 text-gray-400">
                        {item.description}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    {/* Action */}
                    <Link
                      href={item.href}
                      className="shrink-0 rounded-xl bg-yellow-400 px-5 py-3 text-center text-sm font-bold text-black transition hover:bg-yellow-300"
                    >
                      {item.type === "connection"
                        ? "View Request →"
                        : "Open Message →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer message */}
        <div className="mt-10 rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/10 to-transparent p-6">
          <h3 className="font-bold text-yellow-400">
            ನಮ್ಮವರು — ನಮ್ಮ ಜನ ❤️
          </h3>

          <p className="mt-2 text-sm text-gray-400">
            Stay connected with your Kannada community wherever you are.
          </p>
        </div>

      </div>
    </main>
  );
}
