
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Opportunity = {
  id: number;
  title: string;
  company: string;
  location: string;
  opportunity_type: string;
  work_mode: string;
  description: string;
  application_url: string | null;
  posted_by: string;
  posted_by_name: string;
  created_at: string;
};

const types = ["All", "Job", "Internship", "Part-time", "Remote"];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [opportunityType, setOpportunityType] = useState("Internship");
  const [workMode, setWorkMode] = useState("On-site");
  const [description, setDescription] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOpportunities() {
    try {
      setError("");

      const response = await fetch("/api/opportunities", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load opportunities");
      }

      setOpportunities(data.opportunities || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function publishOpportunity(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setPosting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          company,
          location,
          opportunityType,
          workMode,
          description,
          applicationUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to publish opportunity");
      }

      setOpportunities((previous) => [
        data.opportunity,
        ...previous,
      ]);

      setTitle("");
      setCompany("");
      setLocation("");
      setOpportunityType("Internship");
      setWorkMode("On-site");
      setDescription("");
      setApplicationUrl("");

      setSuccess("Opportunity published successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setPosting(false);
    }
  }

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((item) => {
      const matchesSearch = [
        item.title,
        item.company,
        item.location,
        item.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesType =
        filter === "All" || item.opportunity_type === filter;

      return matchesSearch && matchesType;
    });
  }, [opportunities, search, filter]);

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Nammavaru Careers
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Jobs & Internships
          </h1>

          <p className="mt-3 max-w-2xl text-gray-400">
            Discover career opportunities and help our Kannada
            community grow together.
          </p>
        </div>

        {/* Publish Opportunity */}
        <form
          onSubmit={publishOpportunity}
          className="mb-10 rounded-2xl border border-white/10 bg-[#1A1212] p-5 sm:p-7"
        >
          <h2 className="mb-5 text-xl font-bold">
            Share an Opportunity
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Job / Internship Title *
              </label>
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Developer Intern"
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Company Name *
              </label>
              <input
                required
                maxLength={200}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company name"
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Location *
              </label>
              <input
                required
                maxLength={150}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru / Remote"
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Opportunity Type *
              </label>
              <select
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              >
                {types.slice(1).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Work Mode *
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              >
                <option>On-site</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Application URL
              </label>
              <input
                type="url"
                value={applicationUrl}
                onChange={(e) => setApplicationUrl(e.target.value)}
                placeholder="https://company.com/careers"
                className="w-full rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm text-gray-300">
              Opportunity Description *
            </label>
            <textarea
              required
              maxLength={5000}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, skills required and how to apply..."
              className="w-full resize-y rounded-lg border border-white/10 bg-[#0F0A0A] p-3 outline-none focus:border-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={posting}
            className="mt-5 rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {posting ? "Publishing..." : "Publish Opportunity"}
          </button>
        </form>

        {error && (
          <p className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
            {success}
          </p>
        )}

        {/* Search and Filter */}
        <div className="mb-6">
          <h2 className="mb-4 text-2xl font-bold">
            Explore Opportunities
          </h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, company or location..."
            className="w-full rounded-xl border border-white/10 bg-[#1A1212] p-4 outline-none focus:border-yellow-400"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === type
                    ? "bg-yellow-400 text-black"
                    : "border border-white/10 bg-[#1A1212] text-gray-300 hover:border-yellow-400"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunity List */}
        {loading ? (
          <p className="py-10 text-center text-gray-400">
            Loading opportunities...
          </p>
        ) : filteredOpportunities.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#1A1212] p-10 text-center">
            <p className="text-4xl">💼</p>
            <h3 className="mt-3 text-xl font-bold">
              No opportunities found
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Try another search or publish the first opportunity.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#1A1212] p-5 transition hover:border-yellow-400/40 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-yellow-400">
                      {item.company}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                    {item.opportunity_type}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
                  <span>📍 {item.location}</span>
                  <span>🏢 {item.work_mode}</span>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                  {item.description}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-sm text-gray-300">
                      Posted by {item.posted_by_name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {item.application_url ? (
                    <a
                      href={item.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300"
                    >
                      Apply Now ↗
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">
                      No application link provided
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Community-posted opportunity. Check the employer
                  and application details before sharing personal
                  information.
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
