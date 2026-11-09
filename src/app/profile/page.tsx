
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

type Details = {
  headline: string | null;
  bio: string | null;
  education: string | null;
  institution: string | null;
  graduation_year: number | null;
  skills: string[];
  experience_years: number;
  current_company: string | null;
  job_title: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
};

type MemberProfile = {
  member_type: string;
  verification_status: string;
};

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [details, setDetails] = useState<Details | null>(null);
  const [memberProfile, setMemberProfile] =
    useState<MemberProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadProfile() {
      try {
        const [detailsResponse, profileResponse] = await Promise.all([
          fetch("/api/members/details"),
          fetch("/api/members/profile"),
        ]);

        const detailsData = await detailsResponse.json();
        const profileData = await profileResponse.json();

        if (!detailsResponse.ok || !profileResponse.ok) {
          throw new Error("Unable to load profile information.");
        }

        setDetails(detailsData.details);
        setMemberProfile(profileData.profile);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isLoaded, isSignedIn]);

  async function requestVerification() {
    setVerificationLoading(true);
    setVerificationError("");
    setVerificationMessage("");

    try {
      const response = await fetch("/api/members/verification", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to submit verification request."
        );
      }

      setMemberProfile((previous) =>
        previous
          ? {
              ...previous,
              verification_status: data.verificationStatus,
            }
          : previous
      );

      setVerificationMessage(data.message);
    } catch (err) {
      setVerificationError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#0F0A0A] flex items-center justify-center text-white">
        Loading profile...
      </main>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <main className="min-h-screen bg-[#0F0A0A] flex flex-col items-center justify-center gap-4 text-white">
        <h1 className="text-2xl font-bold">
          Sign in to view your profile
        </h1>

        <Link
          href="/sign-in"
          className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black"
        >
          Sign In
        </Link>
      </main>
    );
  }

  const metadata = user.unsafeMetadata || {};

  const fullName =
    user.fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    "Nammavaru Member";

  const city = String(metadata.city || "");
  const profession = String(metadata.profession || "");
  const interests = String(metadata.interests || "");

  const memberType = memberProfile?.member_type
    ? memberProfile.member_type.replace("_", " ")
    : "Member";

  const verificationStatus =
    memberProfile?.verification_status || "unverified";

  const verificationLabel = verificationStatus.replace("_", " ");

  const canRequestVerification =
    verificationStatus === "unverified" ||
    verificationStatus === "rejected";

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-yellow-400 hover:underline"
          >
            ← Dashboard
          </Link>

          <UserButton />
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <section className="rounded-2xl border border-white/10 bg-[#171010] p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-24 w-24 rounded-full border-2 border-yellow-400 object-cover"
            />

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{fullName}</h1>

              <p className="mt-2 text-gray-400">
                {details?.headline ||
                  profession ||
                  "Add your professional headline"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-sm capitalize text-yellow-400">
                  {memberType}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm capitalize ${
                    verificationStatus === "verified"
                      ? "bg-green-500/10 text-green-400"
                      : verificationStatus === "pending"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-white/10 text-gray-300"
                  }`}
                >
                  {verificationLabel}
                </span>
              </div>

              {city && (
                <p className="mt-3 text-sm text-gray-400">
                  📍 {city}
                </p>
              )}
            </div>

            <Link
              href="/profile/edit"
              className="rounded-xl bg-yellow-400 px-5 py-3 text-center font-bold text-black transition hover:bg-yellow-300"
            >
              Edit Profile
            </Link>
          </div>
        </section>

        {/* Verification Section */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">
                Member Verification
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Verification helps members build trust within the Nammavaru
                professional community.
              </p>
            </div>

            {verificationStatus === "verified" ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-3 font-semibold text-green-400">
                ✓ Verified Member
              </span>
            ) : verificationStatus === "pending" ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-5 py-3 font-semibold text-orange-400">
                ◷ Under Review
              </span>
            ) : (
              <button
                onClick={requestVerification}
                disabled={verificationLoading || !memberProfile}
                className="rounded-lg bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verificationLoading
                  ? "Submitting..."
                  : verificationStatus === "rejected"
                  ? "Request Verification Again"
                  : "Request Verification"}
              </button>
            )}
          </div>

          {verificationStatus === "pending" && (
            <p className="mt-4 text-sm text-orange-300">
              Your request has been submitted. An administrator will review
              your profile.
            </p>
          )}

          {verificationStatus === "rejected" && (
            <p className="mt-4 text-sm text-gray-400">
              Your previous verification request was rejected. You can
              update your profile and submit another request.
            </p>
          )}

          {verificationStatus === "verified" && (
            <p className="mt-4 text-sm text-green-400">
              Your member profile has been verified by a Nammavaru
              administrator.
            </p>
          )}

          {verificationMessage && (
            <p className="mt-4 text-sm text-green-400">
              {verificationMessage}
            </p>
          )}

          {verificationError && (
            <p className="mt-4 text-sm text-red-400">
              {verificationError}
            </p>
          )}
        </section>

        {/* About */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            About Me
          </h2>

          <p className="whitespace-pre-wrap leading-7 text-gray-300">
            {details?.bio || "No professional introduction added yet."}
          </p>

          {interests && (
            <p className="mt-4 text-sm text-gray-400">
              Interests: {interests}
            </p>
          )}
        </section>

        {/* Education */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Education
          </h2>

          {details?.education || details?.institution ? (
            <>
              <h3 className="font-semibold">
                {details.education || "Qualification not specified"}
              </h3>

              <p className="mt-1 text-gray-400">
                {details.institution || "Institution not specified"}
              </p>

              {details.graduation_year && (
                <p className="mt-2 text-sm text-gray-500">
                  Graduation year: {details.graduation_year}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400">
              No education details added yet.
            </p>
          )}
        </section>

        {/* Skills */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Skills
          </h2>

          {details?.skills?.length ? (
            <div className="flex flex-wrap gap-3">
              {details.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No skills added yet.</p>
          )}
        </section>

        {/* Experience */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Experience
          </h2>

          <p className="text-gray-300">
            {details?.experience_years ?? 0} years of experience
          </p>

          {(details?.job_title || details?.current_company) && (
            <div className="mt-3">
              <h3 className="font-semibold">
                {details.job_title || "Role not specified"}
              </h3>

              <p className="text-gray-400">
                {details.current_company || "Company not specified"}
              </p>
            </div>
          )}
        </section>

        {/* Professional Links */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#171010] p-6">
          <h2 className="mb-4 text-xl font-bold text-yellow-400">
            Professional Links
          </h2>

          <div className="flex flex-col gap-3">
            {details?.linkedin_url && (
              <a
                href={details.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                LinkedIn Profile ↗
              </a>
            )}

            {details?.portfolio_url && (
              <a
                href={details.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                Portfolio / GitHub ↗
              </a>
            )}

            {details?.resume_url && (
              <a
                href={details.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:underline"
              >
                View Resume ↗
              </a>
            )}

            {!details?.linkedin_url &&
              !details?.portfolio_url &&
              !details?.resume_url && (
                <p className="text-gray-400">
                  No professional links added yet.
                </p>
              )}
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/profile/edit"
            className="text-yellow-400 hover:underline"
          >
            Update your professional information →
          </Link>
        </div>

      </div>
    </main>
  );
}
