
"use client";

import Link from "next/link";
import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <nav className="border-b border-white/10 sticky top-0 z-50 bg-[#0F0A0A]/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold text-lg">
            ನ
          </div>
          <span className="text-xl font-bold tracking-wide">
            Nammavaru
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <Link href="/#features" className="hover:text-yellow-400 transition">
            Features
          </Link>
          <Link href="/#how" className="hover:text-yellow-400 transition">
            How it works
          </Link>
          <Link href="/about" className="hover:text-yellow-400 transition">
            About
          </Link>
          <Link href="/join" className="hover:text-yellow-400 transition">
            Join
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isLoaded ? null : isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm text-white/80 hover:text-white px-3 py-1.5">
                  Login
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="bg-yellow-400 text-black text-sm font-semibold px-5 py-2 rounded-full hover:bg-yellow-300 transition">
                  Join Now
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
