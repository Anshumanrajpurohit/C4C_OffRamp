"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (session) {
      router.replace("/profile-setup");
    }
  }, [router, session]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Sending magic link...");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Check your email for a magic link.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStatus("Signed out.");
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileStatus("Saving...");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, avatar_url: avatarUrl }),
    });
    const body = await res.json();
    if (!res.ok) {
      setProfileStatus(body.error || "Failed to save profile");
    } else {
      setProfileStatus("Profile saved");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9fbf9] via-white to-[#eef6ef] text-[#121716]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16695b]/10 text-[#16695b]">
              <span className="material-symbols-outlined">eco</span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase text-[#66857f]">OffRamp</p>
              <p className="text-lg font-bold text-[#121716]">PlantSwap Account</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#dce4e3] bg-white px-4 py-2 text-sm font-semibold text-[#16695b] transition hover:border-[#16695b] hover:bg-[#e3ebe9]"
          >
            ← Back home
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[#eef2f1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#66857f]">Sign in</p>
                <h1 className="text-2xl font-bold text-[#121716]">Magic link login</h1>
                <p className="text-sm text-[#66857f]">No password. Just your email.</p>
              </div>
              <div className="rounded-full bg-[#e3ebe9] px-3 py-1 text-xs font-bold uppercase text-[#16695b]">Secure</div>
            </div>

            <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-4">
              <label className="text-sm font-medium text-[#121716]">
                Work or personal email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-[#dce4e3] bg-white px-4 py-3 text-[#121716] shadow-sm focus:border-[#16695b] focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[#16695b] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,105,91,0.35)] transition hover:-translate-y-[1px] hover:bg-[#104f44]"
              >
                Send magic link
              </button>
            </form>
            {status && <p className="mt-3 text-sm text-[#16695b]">{status}</p>}
          </div>

          <div className="rounded-2xl border border-[#eef2f1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#121716]">Session</h2>
              <button
                onClick={handleSignOut}
                className="rounded-full bg-[#f1f5f3] px-3 py-1 text-sm font-semibold text-[#121716] transition hover:bg-[#e3ebe9]"
              >
                Sign out
              </button>
            </div>
            <p className="mt-2 text-sm text-[#66857f]">
              {session ? `Signed in as ${session.user.email}` : "No active session"}
            </p>

            <div className="mt-6 rounded-xl border border-dashed border-[#dce4e3] bg-[#f9fbf9] p-4 text-sm text-[#66857f]">
              Use the same email you entered to finish login from your inbox. Magic link works on web and mobile.
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[#eef2f1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#66857f]">Profile</p>
                <h2 className="text-xl font-semibold text-[#121716]">Personalize your swaps</h2>
                <p className="text-sm text-[#66857f]">Update your display name and avatar. Requires an active session.</p>
              </div>
              <span className="rounded-full bg-[#f1f5f3] px-3 py-1 text-xs font-semibold text-[#16695b]">Optional</span>
            </div>
            <form onSubmit={handleSaveProfile} className="mt-6 flex flex-col gap-4">
              <label className="text-sm font-medium text-[#121716]">
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dce4e3] bg-white px-4 py-3 text-[#121716] shadow-sm focus:border-[#16695b] focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-[#121716]">
                Avatar URL
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#dce4e3] bg-white px-4 py-3 text-[#121716] shadow-sm focus:border-[#16695b] focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={!session}
                className="inline-flex items-center justify-center rounded-xl bg-[#16695b] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,105,91,0.35)] transition hover:-translate-y-[1px] hover:bg-[#104f44] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save profile
              </button>
            </form>
            {profileStatus && <p className="mt-3 text-sm text-[#16695b]">{profileStatus}</p>}
          </div>

          <div className="rounded-2xl border border-[#eef2f1] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#121716]">Why sign in?</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#66857f]">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#16695b]">check_circle</span>
                <span>Save your favorite swaps and restaurant picks across devices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#16695b]">check_circle</span>
                <span>Track your water, carbon, and animal impact over time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#16695b]">check_circle</span>
                <span>Get personalized recommendations based on your cuisine and protein preferences.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
