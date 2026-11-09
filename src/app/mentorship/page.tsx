
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Mentor {
  user_id: string;
  headline: string;
  expertise: string;
  experience_years: number;
  bio: string;
  is_available: boolean;
  name: string;
  imageUrl?: string;
}

export default function MentorshipPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [message, setMessage] = useState("");
  const [goals, setGoals] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  async function loadMentors() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/mentorship/mentors");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load mentors");
      }

      setMentors(data.mentors || []);
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
    loadMentors();
  }, []);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      if (mentor.user_id === currentUserId) return false;

      const searchText = search.toLowerCase();

      return (
        mentor.name.toLowerCase().includes(searchText) ||
        mentor.headline.toLowerCase().includes(searchText) ||
        mentor.expertise.toLowerCase().includes(searchText) ||
        mentor.bio.toLowerCase().includes(searchText)
      );
    });
  }, [mentors, currentUserId, search]);

  async function sendRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedMentor) return;

    try {
      setSubmitting(true);
      setSuccess("");
      setError("");

      const response = await fetch("/api/mentorship/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mentorId: selectedMentor.user_id,
          message,
          goals,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not send request");
      }

      setSuccess("Your mentorship request has been sent!");

      setSelectedMentor(null);
      setMessage("");
      setGoals("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white px-5 py-10">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-10">

          <div>
            <Link
              href="/dashboard"
              className="text-yellow-400 text-sm hover:text-yellow-300"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold mt-5">
              Find Your <span className="text-yellow-400">Mentor</span>
            </h1>

            <p className="text-gray-400 mt-3 max-w-2xl">
              Connect with experienced professionals, learn from their
              journeys and take your career forward.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/mentorship/register"
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-5 py-3 rounded-xl transition"
            >
              + Become a Mentor
            </Link>

            <Link
              href="/mentorship/requests"
              className="border border-white/20 hover:border-yellow-400 px-5 py-3 rounded-xl transition"
            >
              My Requests
            </Link>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl">
            {success}
            <Link
              href="/mentorship/requests"
              className="underline ml-2"
            >
              View requests
            </Link>
          </div>
        )}

        {/* Search */}
        <div className="bg-[#191111] border border-white/10 rounded-2xl p-5 mb-8">

          <label className="block text-sm font-medium mb-3">
            Search mentors by name, skills or expertise
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Python, React, Software Engineer..."
            className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400"
          />

        </div>

        {/* Mentor count */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Available Mentors
          </h2>

          <span className="text-gray-400 text-sm">
            {filteredMentors.length} mentors found
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            Loading mentors...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-xl">
            {error}
            <button
              onClick={loadMentors}
              className="underline ml-3"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredMentors.length === 0 && (
          <div className="bg-[#191111] border border-white/10 rounded-2xl p-10 text-center">

            <div className="text-5xl mb-5">🎓</div>

            <h3 className="text-xl font-bold">
              {search ? "No matching mentors found" : "No mentors available yet"}
            </h3>

            <p className="text-gray-400 mt-3">
              {search
                ? "Try searching with different skills or keywords."
                : "Be one of the first professionals to guide the Nammavaru community."}
            </p>

            {!search && (
              <Link
                href="/mentorship/register"
                className="inline-block mt-6 bg-yellow-400 text-black font-semibold px-6 py-3 rounded-xl"
              >
                Become a Mentor
              </Link>
            )}
          </div>
        )}

        {/* Mentor cards */}
        {!loading && !error && filteredMentors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {filteredMentors.map((mentor) => (
              <div
                key={mentor.user_id}
                className="bg-[#191111] border border-white/10 hover:border-yellow-400/50 rounded-2xl p-6 transition"
              >

                <div className="flex items-center gap-4 mb-5">

                  {mentor.imageUrl ? (
                    <img
                      src={mentor.imageUrl}
                      alt={mentor.name}
                      className="w-14 h-14 rounded-full object-cover border border-yellow-400/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center text-xl font-bold">
                      {mentor.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate">
                      {mentor.name}
                    </h3>

                    <p className="text-gray-400 text-sm truncate">
                      {mentor.headline}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-yellow-400 text-sm font-semibold">
                    {mentor.experience_years} years experience
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    Expertise
                  </p>

                  <p className="text-sm text-gray-300">
                    {mentor.expertise}
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                    About
                  </p>

                  <p className="text-sm text-gray-400 leading-6 line-clamp-3">
                    {mentor.bio}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setError("");
                    setSelectedMentor(mentor);
                  }}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-xl transition"
                >
                  Request Mentorship
                </button>

              </div>
            ))}

          </div>
        )}

        {/* Request modal */}
        {selectedMentor && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

            <div className="w-full max-w-lg bg-[#191111] border border-white/10 rounded-2xl p-6">

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    Request Mentorship
                  </h2>

                  <p className="text-gray-400 text-sm mt-1">
                    To {selectedMentor.name}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedMentor(null);
                    setError("");
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={sendRequest} className="space-y-5">

                <div>
                  <label className="block text-sm mb-2">
                    Why do you want mentorship? *
                  </label>

                  <textarea
                    required
                    maxLength={2000}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you want guidance..."
                    className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl p-4 outline-none focus:border-yellow-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">
                    Your learning or career goals
                  </label>

                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Example: Prepare for software engineering interviews..."
                    className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl p-4 outline-none focus:border-yellow-400 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl"
                >
                  {submitting ? "Sending..." : "Send Mentorship Request"}
                </button>

              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

