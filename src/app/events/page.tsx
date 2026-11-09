
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type EventItem = {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  event_date: string;
  event_time: string;
  created_by: string;
  attendee_count: number;
  is_registered: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  category: "Technology",
  city: "",
  venue: "",
  event_date: "",
  event_time: "",
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyEventId, setBusyEventId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/events");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load events");
      }

      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create event");
      }

      setForm(emptyForm);
      setMessage("Your event has been created successfully!");
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRegistration(event: EventItem) {
    setError("");
    setMessage("");
    setBusyEventId(event.id);

    try {
      const response = await fetch("/api/events/registrations", {
        method: event.is_registered ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setMessage(
        event.is_registered
          ? "Your registration has been cancelled."
          : "You are registered for this event!"
      );

      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusyEventId(null);
    }
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function formatDate(value: string) {
    const date = value.slice(0, 10);
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value: string) {
    const time = value.slice(0, 5);
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#191111] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-yellow-400";

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-10 mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Nammavaru Community
          </p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Community Events
          </h1>
          <p className="mt-3 max-w-2xl text-gray-400">
            Discover events, meet people, share ideas and connect with the
            Kannadiga community.
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

        <section className="mb-12 rounded-2xl border border-white/10 bg-[#171010] p-6 md:p-8">
          <h2 className="mb-2 text-2xl font-bold">Create an Event</h2>
          <p className="mb-6 text-sm text-gray-400">
            Organizing a meetup or community activity? Share it here.
          </p>

          <form onSubmit={createEvent} className="grid gap-4 md:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Event title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              maxLength={150}
              required
            />

            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option>Technology</option>
              <option>Education</option>
              <option>Business</option>
              <option>Cultural</option>
              <option>Networking</option>
              <option>Community</option>
              <option>Other</option>
            </select>

            <input
              className={inputClass}
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              maxLength={100}
              required
            />

            <input
              className={inputClass}
              placeholder="Venue"
              value={form.venue}
              onChange={(e) => updateField("venue", e.target.value)}
              maxLength={200}
              required
            />

            <input
              className={inputClass}
              type="date"
              value={form.event_date}
              onChange={(e) => updateField("event_date", e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />

            <input
              className={inputClass}
              type="time"
              value={form.event_time}
              onChange={(e) => updateField("event_time", e.target.value)}
              required
            />

            <textarea
              className={`${inputClass} min-h-28 md:col-span-2`}
              placeholder="Describe your event..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              <p className="mt-1 text-sm text-gray-400">
                Find an event and register to participate.
              </p>
            </div>

            <button
              onClick={loadEvents}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
            >
              Refresh Events
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-400">
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#171010] p-10 text-center">
              <h3 className="text-xl font-semibold">No events yet</h3>
              <p className="mt-2 text-gray-400">
                Be the first member to create a community event!
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-[#171010] p-6 transition hover:border-yellow-400/50"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                      {event.category}
                    </span>
                    <span className="text-sm text-gray-400">
                      {event.attendee_count}{" "}
                      {event.attendee_count === 1 ? "attendee" : "attendees"}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold">{event.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                    {event.description}
                  </p>

                  <div className="mt-5 space-y-2 text-sm text-gray-300">
                    <p>📅 {formatDate(event.event_date)}</p>
                    <p>🕒 {formatTime(event.event_time)}</p>
                    <p>📍 {event.venue}, {event.city}</p>
                    <p className="text-xs text-gray-500">
                      Organized by {event.created_by}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleRegistration(event)}
                    disabled={busyEventId === event.id}
                    className={`mt-6 w-full rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      event.is_registered
                        ? "border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:bg-red-500/10 hover:text-red-300"
                        : "bg-yellow-400 text-black hover:bg-yellow-300"
                    }`}
                  >
                    {busyEventId === event.id
                      ? "Please wait..."
                      : event.is_registered
                        ? "Cancel Registration"
                        : "Register for Event"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
