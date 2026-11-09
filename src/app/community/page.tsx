
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

type Member = {
  id: string;
  name: string;
  imageUrl?: string;
  city: string;
  profession: string;
  interests: string;
  verificationStatus: string;
  memberType?: string;
  headline?: string;
  bio?: string;
  education?: string;
  institution?: string;
  graduationYear?: number | null;
  skills?: string[];
  experienceYears?: number | null;
  currentCompany?: string;
  jobTitle?: string;
};

export default function CommunityPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/community/members");

        if (!response.ok) {
          throw new Error("Unable to load community members.");
        }

        const result = await response.json();
        setMembers(result.members || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return members;

    return members.filter((member) =>
      [
        member.name,
        member.city,
        member.profession,
        member.interests,
        member.headline,
        member.currentCompany,
        member.education,
        ...(member.skills || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [members, search]);

  const verifiedCount = members.filter(
    (member) => member.verificationStatus === "verified"
  ).length;

  function VerificationBadge({ status }: { status: string }) {
    switch (status) {
      case "verified":
        return (
          <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-400">
            ✓ Verified Member
          </span>
        );

      case "pending":
        return (
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            ◷ Verification Pending
          </span>
        );

      case "rejected":
        return (
          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-400">
            ✕ Not Approved
          </span>
        );

      default:
        return (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
            Not Verified
          </span>
        );
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-400">
              NAMMAVARU COMMUNITY
            </p>

            <h1 className="mt-2 text-3xl font-bold md:text-4xl">
              Discover Our People
            </h1>

            <p className="mt-2 text-white/60">
              Connect with Kannadigas and build meaningful relationships.
            </p>
          </div>

          <UserButton />
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-5">
          <Link
            href="/dashboard"
            className="text-sm text-yellow-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <Link
            href="/profile"
            className="text-sm text-yellow-400 hover:underline"
          >
            My Professional Profile →
          </Link>
        </div>

        {/* Statistics */}
        {!loading && !error && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/50">Total Members</p>
              <p className="mt-2 text-3xl font-bold">{members.length}</p>
            </div>

            <div className="rounded-xl border border-blue-400/20 bg-blue-400/5 p-5">
              <p className="text-sm text-blue-300">Verified Members</p>
              <p className="mt-2 text-3xl font-bold text-blue-400">
                {verifiedCount}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-8 mt-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, profession, company or skills..."
            className="w-full rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <p className="mb-6 text-sm text-white/60">
          {filteredMembers.length} member(s) found
        </p>

        {/* Loading */}
        {loading && (
          <p className="py-10 text-center text-white/60">
            Loading community members...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 py-10 text-center text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMembers.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
            <div className="mb-4 text-4xl">👥</div>
            <h2 className="text-xl font-semibold">No members found</h2>
            <p className="mt-2 text-white/60">
              Try another search or invite more people to Nammavaru.
            </p>
          </div>
        )}

        {/* Member Cards */}
        {!loading && !error && filteredMembers.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-yellow-400/50"
              >
                {/* Avatar */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-yellow-400 text-2xl font-bold text-black">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    member.name?.charAt(0).toUpperCase() || "N"
                  )}
                </div>

                {/* Name and Profession */}
                <h2 className="text-xl font-semibold">
                  {member.name}
                </h2>

                <p className="mt-1 text-sm text-yellow-400">
                  {member.jobTitle ||
                    member.profession ||
                    "Community Member"}
                </p>

                {member.headline && (
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {member.headline}
                  </p>
                )}

                <div className="mt-3">
                  <VerificationBadge status={member.verificationStatus} />
                </div>

                {/* Location */}
                {member.city && member.city !== "Not provided" && (
                  <p className="mt-4 text-sm text-white/60">
                    📍 {member.city}
                  </p>
                )}

                {/* Company */}
                {member.currentCompany && (
                  <p className="mt-2 text-sm text-white/70">
                    🏢 {member.currentCompany}
                  </p>
                )}

                {/* Experience */}
                {member.experienceYears !== null &&
                  member.experienceYears !== undefined && (
                    <p className="mt-2 text-sm text-white/70">
                      💼 {member.experienceYears} years experience
                    </p>
                  )}

                {/* Education */}
                {(member.education || member.institution) && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      Education
                    </p>
                    <p className="mt-2 text-sm text-white/80">
                      {[member.education, member.institution]
                        .filter(Boolean)
                        .join(" • ")}
                      {member.graduationYear
                        ? ` (${member.graduationYear})`
                        : ""}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={`${member.id}-skill-${index}`}
                          className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-xs text-yellow-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {member.interests && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-wide text-white/50">
                      Interests
                    </p>
                    <p className="mt-2 text-sm text-white/80">
                      {member.interests}
                    </p>
                  </div>
                )}

                {/* View Profile */}
                <Link
                  href={`/members/${encodeURIComponent(member.id)}`}
                  className="mt-auto mt-6 block w-full rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-yellow-300"
                >
                  View Professional Profile →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
