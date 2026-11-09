
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MentorRegisterPage() {
  const router = useRouter();

  const [headline, setHeadline] = useState("");
  const [expertise, setExpertise] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/mentorship/mentors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline,
          expertise,
          experienceYears: Number(experienceYears),
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setMessage("Your mentor profile has been saved successfully!");

      setTimeout(() => {
        router.push("/mentorship");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white px-5 py-12">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/dashboard"
          className="text-yellow-400 hover:text-yellow-300 text-sm"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8 mb-8">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">
            Nammavaru Mentorship
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-3">
            Become a Mentor
          </h1>

          <p className="text-gray-400 mt-3 leading-7">
            Share your knowledge, guide students and freshers,
            and help Kannadigas grow together.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#191111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              Professional Headline *
            </label>

            <input
              required
              maxLength={200}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Example: Senior Software Engineer at ABC Company"
              className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Areas of Expertise *
            </label>

            <input
              required
              maxLength={500}
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="Example: Python, React, AWS, Data Science"
              className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400"
            />

            <p className="text-gray-500 text-xs mt-2">
              Separate multiple skills using commas.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Years of Experience *
            </label>

            <input
              required
              type="number"
              min="0"
              max="60"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              About You *
            </label>

            <textarea
              required
              maxLength={2000}
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your experience, career journey and how you can guide them..."
              className="w-full bg-[#0F0A0A] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 resize-none"
            />

            <p className="text-gray-500 text-xs mt-2">
              Maximum 2000 characters.
            </p>
          </div>

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-3 text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition"
          >
            {loading ? "Saving Profile..." : "Register as a Mentor"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Your mentor profile will be visible to signed-in Nammavaru members.
          </p>
        </form>
      </div>
    </main>
  );
}
