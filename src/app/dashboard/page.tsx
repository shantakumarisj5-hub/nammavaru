
"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const dashboardFeatures = [
  {
    title: "Community",
    description: "Discover and connect with Kannadigas around the world.",
    icon: "👥",
    href: "/community",
    label: "Explore Community",
  },
  {
    title: "Jobs & Internships",
    description: "Discover career opportunities and internships shared by the community.",
    icon: "💼",
    href: "/opportunities",
    label: "Explore Opportunities",
  },
  {
    title: "My Connections",
    description: "Build your professional network and connect with people.",
    icon: "🤝",
    href: "/connections",
    label: "Manage Connections",
  },
  {
    title: "Referral Center",
    description: "Request and provide job referrals through trusted connections.",
    icon: "🚀",
    href: "/referrals",
    label: "Explore Referrals",
  },
  {
    title: "Messages",
    description: "Chat privately with your professional connections.",
    icon: "💬",
    href: "/messages",
    label: "Open Messages",
  },
  {
    title: "Notifications",
    description: "Stay updated about connection requests and unread messages.",
    icon: "🔔",
    href: "/notifications",
    label: "View Notifications",
  },
  {
    title: "Community Feed",
    description: "Share achievements, ask questions and exchange ideas.",
    icon: "📰",
    href: "/feed",
    label: "Explore Feed",
  },
  {
    title: "Events",
    description: "Discover events and participate in Kannada community activities.",
    icon: "🎉",
    href: "/events",
    label: "Explore Events",
  },
  {
    title: "My Profile",
    description: "Showcase your profession, skills, city and interests.",
    icon: "👤",
    href: "/profile",
    label: "View Profile",
  },
  {
    title: "About Nammavaru",
    description: "Learn about our mission and Kannada professional community.",
    icon: "❤️",
    href: "/about",
    label: "Learn More",
  },
];

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0A0A] text-white">
        Loading your dashboard...
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">

        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold tracking-widest text-yellow-400">
              NAMMAVARU PROFESSIONAL COMMUNITY
            </p>

            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Welcome, {user.firstName || "Member"}!
            </h1>

            <p className="mt-2 text-white/60">
              Your community. Your opportunities. Your growth.
            </p>
          </div>

          <UserButton />
        </div>

        {/* Welcome Banner */}
        <div className="mb-12 rounded-2xl border border-yellow-400/20 bg-gradient-to-r from-yellow-400/15 to-transparent p-7 md:p-9">
          <p className="text-sm font-semibold text-yellow-400">
            YOUR COMMUNITY. YOUR PEOPLE. YOUR OPPORTUNITIES.
          </p>

          <h2 className="mt-3 text-2xl font-bold md:text-3xl">
            ನಮಸ್ಕಾರ, {user.firstName || "ಸ್ನೇಹಿತ"}!
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-white/70">
            Discover genuine jobs and internships, connect with
            professionals, find mentors, request referrals and
            grow together with Kannadigas across the world.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/opportunities"
              className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
            >
              Find Opportunities →
            </Link>

            <Link
              href="/connections"
              className="rounded-xl border border-yellow-400/40 px-6 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400/10"
            >
              Grow Your Network →
            </Link>
          </div>
        </div>

        {/* Dashboard Features */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Explore Nammavaru
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Connect, discover opportunities and grow your professional network.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardFeatures.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/50 hover:bg-white/[0.08]"
            >
              <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-yellow-400/10 text-3xl">
                {feature.icon}
              </div>

              <h3 className="text-xl font-bold transition group-hover:text-yellow-400">
                {feature.title}
              </h3>

              <p className="mt-3 min-h-12 text-sm leading-6 text-white/60">
                {feature.description}
              </p>

              <p className="mt-5 text-sm font-semibold text-yellow-400">
                {feature.label} →
              </p>
            </Link>
          ))}
        </div>

        {/* Mission Banner */}
        <div className="mt-12 rounded-2xl bg-yellow-400 p-8 text-black md:p-10">
          <p className="text-sm font-bold uppercase tracking-widest">
            Our Mission
          </p>

          <h2 className="mt-3 text-2xl font-bold md:text-3xl">
            ನಮ್ಮವರು — ನಮ್ಮ ಜನ, ನಮ್ಮ ಹೆಮ್ಮೆ!
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-black/80">
            Talent should never miss opportunities because of a lack
            of connections. Together, we create opportunities,
            share knowledge and help the next generation grow.
          </p>

          <p className="mt-5 font-bold">
            ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} Nammavaru.
          Made with ❤️ for Kannadigas.
        </footer>

      </div>
    </main>
  );
}
