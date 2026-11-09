
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileDetails = {
  headline: string;
  bio: string;
  education: string;
  institution: string;
  graduation_year: number | null;
  skills: string[];
  experience_years: number;
  current_company: string;
  job_title: string;
  resume_url: string;
  linkedin_url: string;
  portfolio_url: string;
};

const initialForm = {
  headline: "",
  bio: "",
  education: "",
  institution: "",
  graduationYear: "",
  skills: "",
  experienceYears: "0",
  currentCompany: "",
  jobTitle: "",
  resumeUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

export default function EditProfilePage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDetails() {
      try {
        const response = await fetch("/api/members/details");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load profile.");
        }

        const details: ProfileDetails | null = data.details;

        if (details) {
          setForm({
            headline: details.headline || "",
            bio: details.bio || "",
            education: details.education || "",
            institution: details.institution || "",
            graduationYear:
              details.graduation_year?.toString() || "",
            skills: (details.skills || []).join(", "),
            experienceYears:
              details.experience_years?.toString() || "0",
            currentCompany: details.current_company || "",
            jobTitle: details.job_title || "",
            resumeUrl: details.resume_url || "",
            linkedinUrl: details.linkedin_url || "",
            portfolioUrl: details.portfolio_url || "",
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/members/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headline: form.headline,
          bio: form.bio,
          education: form.education,
          institution: form.institution,
          graduationYear: form.graduationYear,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          experienceYears: form.experienceYears,
          currentCompany: form.currentCompany,
          jobTitle: form.jobTitle,
          resumeUrl: form.resumeUrl,
          linkedinUrl: form.linkedinUrl,
          portfolioUrl: form.portfolioUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save profile.");
      }

      setMessage("Your professional profile was saved successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#1A1212] px-4 py-3 text-white outline-none transition focus:border-yellow-400";

  const labelClass = "mb-2 block text-sm font-medium text-gray-300";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0A0A] flex items-center justify-center text-white">
        Loading your profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/profile"
          className="mb-6 inline-block text-sm text-yellow-400 hover:underline"
        >
          ← Back to Profile
        </Link>

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Nammavaru Professional Network
          </p>

          <h1 className="text-3xl font-bold md:text-4xl">
            Edit Professional Profile
          </h1>

          <p className="mt-3 text-gray-400">
            Share your education, skills and experience.
            Help other members discover your professional journey.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-white/10 bg-[#171010] p-5 md:p-8"
        >

          {/* Basic Information */}
          <section>
            <h2 className="mb-5 text-xl font-semibold text-yellow-400">
              Basic Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Professional Headline
                </label>
                <input
                  name="headline"
                  value={form.headline}
                  onChange={handleChange}
                  maxLength={200}
                  placeholder="Example: Computer Science Student | Full Stack Developer"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  About Me
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  maxLength={5000}
                  rows={5}
                  placeholder="Tell the community about yourself..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Education */}
          <section>
            <h2 className="mb-5 text-xl font-semibold text-yellow-400">
              Education
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Degree / Qualification
                </label>
                <input
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  placeholder="Example: B.E, BCA, MBA"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  College / Institution
                </label>
                <input
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder="Enter institution name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Graduation Year
                </label>
                <input
                  type="number"
                  name="graduationYear"
                  value={form.graduationYear}
                  onChange={handleChange}
                  min="1950"
                  max="2100"
                  placeholder="Example: 2027"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Skills and Experience */}
          <section>
            <h2 className="mb-5 text-xl font-semibold text-yellow-400">
              Skills & Experience
            </h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Skills
                </label>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="Python, React, Java, SQL"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Separate each skill with a comma.
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  min="0"
                  max="60"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Current Company
                  </label>
                  <input
                    name="currentCompany"
                    value={form.currentCompany}
                    onChange={handleChange}
                    placeholder="Company name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Current Job Title
                  </label>
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleChange}
                    placeholder="Example: Software Engineer"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Professional Links */}
          <section>
            <h2 className="mb-5 text-xl font-semibold text-yellow-400">
              Professional Links
            </h2>

            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Resume URL
                </label>
                <input
                  type="url"
                  name="resumeUrl"
                  value={form.resumeUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  value={form.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Portfolio / GitHub URL
                </label>
                <input
                  type="url"
                  name="portfolioUrl"
                  value={form.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Feedback */}
          {message && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Professional Profile"}
            </button>

            <Link
              href="/profile"
              className="rounded-xl border border-white/15 px-6 py-3 text-center text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </main>
  );
}
