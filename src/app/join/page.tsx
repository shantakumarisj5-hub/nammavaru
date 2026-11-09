
"use client";

import { useState } from "react";

export default function Join() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const data = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      role: formData.get("role"),
      city: formData.get("city"),
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <section className="max-w-xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-yellow-400 mb-3">ನಮ್ಮವರಾಗಿ</p>
          <h1 className="text-4xl font-bold mb-4">
            Join Nammavaru
          </h1>
          <p className="text-white/60">
            Be part of a trusted community where Kannadigas help each other grow.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white/5 border border-yellow-400/40 rounded-2xl p-10 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-3">
              Thank you!
            </h2>
            <p className="text-white/70">
              You have joined the early-access waitlist.
              We will contact you soon.
            </p>
            <p className="text-white/40 mt-4 text-sm">
              ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  Email
                </label>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  I am a
                </label>
                <select
                  required
                  name="role"
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400"
                >
                  <option className="bg-[#0F0A0A]">Student</option>
                  <option className="bg-[#0F0A0A]">Fresher</option>
                  <option className="bg-[#0F0A0A]">Working Professional</option>
                  <option className="bg-[#0F0A0A]">Startup / Employer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1.5">
                  City
                </label>
                <input
                  required
                  name="city"
                  type="text"
                  placeholder="Bengaluru, Mysuru, Mangaluru..."
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 text-black font-semibold py-3.5 rounded-xl hover:bg-yellow-300 transition mt-2 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Join the Waitlist"}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-6">
              We respect your privacy. No spam.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
