
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const memberTypes = [
  {
    value: "student",
    title: "Student",
    description: "I am currently studying in college or university.",
    icon: "🎓",
  },
  {
    value: "fresher",
    title: "Fresher",
    description: "I recently graduated and am looking for opportunities.",
    icon: "🚀",
  },
  {
    value: "professional",
    title: "Professional",
    description: "I am currently working in an organization.",
    icon: "💼",
  },
  {
    value: "startup",
    title: "Startup Founder",
    description: "I am building or managing a startup.",
    icon: "🏢",
  },
  {
    value: "employer",
    title: "Employer",
    description: "I represent a company and hire candidates.",
    icon: "👔",
  },
];

const capabilities = [
  {
    value: "mentor",
    title: "Become a Mentor",
    description: "Guide students, freshers and other professionals.",
    icon: "🎯",
  },
  {
    value: "referrer",
    title: "Become a Referrer",
    description: "Help suitable candidates get employee referrals.",
    icon: "🤝",
  },
  {
    value: "recruiter",
    title: "Become a Recruiter",
    description: "Discover and connect with suitable candidates.",
    icon: "🔍",
  },
  {
    value: "job_publisher",
    title: "Publish Jobs",
    description: "Share genuine jobs and internship opportunities.",
    icon: "📢",
  },
  {
    value: "event_organizer",
    title: "Organize Events",
    description: "Organize career events and community activities.",
    icon: "📅",
  },
];

type CapabilityStatus = {
  capability: string;
  status: string;
};

export default function OnboardingPage() {
  const [memberType, setMemberType] = useState("student");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [existingCapabilities, setExistingCapabilities] = useState<
    CapabilityStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/members/profile");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load profile.");
        }

        if (data.profile?.member_type) {
          setMemberType(data.profile.member_type);
        }

        setExistingCapabilities(data.capabilities || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function toggleCapability(value: string) {
    setSelectedCapabilities((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const profileResponse = await fetch("/api/members/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberType }),
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Failed to save account type.");
      }

      const results = await Promise.all(
        selectedCapabilities.map(async (capability) => {
          const response = await fetch("/api/members/capabilities", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ capability }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || `Could not request ${capability}.`);
          }

          return data;
        })
      );

      const updatedResponse = await fetch("/api/members/profile");
      const updatedData = await updatedResponse.json();

      if (updatedResponse.ok) {
        setExistingCapabilities(updatedData.capabilities || []);
      }

      setSelectedCapabilities([]);

      const pendingCount = results.filter(
        (item) => item.capability?.status === "pending"
      ).length;

      setMessage(
        results.length === 0
          ? "Your account type was saved successfully!"
          : `Account saved! ${pendingCount} capability request(s) are pending approval.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0A0A] text-white flex items-center justify-center">
        Loading your profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white px-5 py-10">
      <div className="max-w-4xl mx-auto">

        <Link
          href="/dashboard"
          className="text-yellow-400 hover:text-yellow-300 text-sm"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-8 mb-10">
          <p className="text-yellow-400 text-sm font-semibold tracking-widest uppercase">
            NAMMAVARU MEMBERSHIP
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-3">
            Set up your professional identity
          </h1>

          <p className="text-gray-400 mt-3 leading-7">
            Tell the community who you are and how you would like to
            contribute. You can be a student, professional, mentor,
            referrer or more.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl border border-green-700 bg-green-950/40 text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-700 bg-red-950/40 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">

          <section>
            <h2 className="text-xl font-bold mb-2">
              1. What describes you best?
            </h2>

            <p className="text-gray-400 text-sm mb-5">
              Select your primary member type.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {memberTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => setMemberType(type.value)}
                  className={`text-left p-5 rounded-2xl border transition ${
                    memberType === type.value
                      ? "border-yellow-400 bg-yellow-400/10"
                      : "border-white/10 bg-[#191313] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{type.icon}</span>

                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        memberType === type.value
                          ? "border-yellow-400 bg-yellow-400"
                          : "border-gray-500"
                      }`}
                    >
                      {memberType === type.value && (
                        <span className="text-black text-xs">✓</span>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold mt-4">{type.title}</h3>

                  <p className="text-sm text-gray-400 mt-2">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">
              2. How would you like to contribute?
            </h2>

            <p className="text-gray-400 text-sm mb-5">
              Select any additional capabilities you want to request.
              You can skip this section and request them later.
            </p>

            <div className="space-y-3">
              {capabilities.map((capability) => {
                const existing = existingCapabilities.find(
                  (item) => item.capability === capability.value
                );

                const selected = selectedCapabilities.includes(
                  capability.value
                );

                const locked =
                  existing?.status === "approved" ||
                  existing?.status === "suspended";

                return (
                  <button
                    type="button"
                    key={capability.value}
                    disabled={locked}
                    onClick={() => toggleCapability(capability.value)}
                    className={`w-full text-left p-5 rounded-2xl border transition ${
                      locked
                        ? "border-white/10 bg-[#151111] opacity-70 cursor-not-allowed"
                        : selected
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-white/10 bg-[#191313] hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{capability.icon}</span>

                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {capability.title}
                        </h3>

                        <p className="text-sm text-gray-400 mt-1">
                          {capability.description}
                        </p>
                      </div>

                      {existing ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-yellow-300">
                          {existing.status}
                        </span>
                      ) : (
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center ${
                            selected
                              ? "bg-yellow-400 border-yellow-400 text-black"
                              : "border-gray-500"
                          }`}
                        >
                          {selected && "✓"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Additional capabilities may require verification and
              administrator approval before you can use restricted features.
            </p>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-yellow-400 text-black font-bold py-4 hover:bg-yellow-300 disabled:opacity-50 transition"
          >
            {saving ? "Saving your profile..." : "Save My Profile"}
          </button>

        </form>
      </div>
    </main>
  );
}
