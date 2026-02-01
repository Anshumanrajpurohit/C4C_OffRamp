"use client";

<<<<<<< HEAD
import { useState } from "react";
import { useRouter } from "next/navigation";
=======
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
>>>>>>> 73c80fc205aeda8dc3927909076ab39609542894
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
<<<<<<< HEAD
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
=======
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [session, setSession] = useState<Session | null>(null);
>>>>>>> 73c80fc205aeda8dc3927909076ab39609542894
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
<<<<<<< HEAD
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
=======

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      const active = data.session ?? null;
      setSession(active);
      if (active) {
        router.replace("/profile-setup");
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        router.replace("/profile-setup");
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [router, supabase]);
>>>>>>> 73c80fc205aeda8dc3927909076ab39609542894

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const demoAccounts = [
      { email: "demo@offramp.app", password: "offramptest123", flag: "1" },
      { email: "demo2@offramp.app", password: "offramptest456", flag: "2" },
      { email: "demoform@offramp.app", password: "offramptest789", flag: "3" },
    ];

    const match = demoAccounts.find(
      (acct) => email.trim().toLowerCase() === acct.email && password === acct.password
    );

    if (match) {
      setStatusType("success");
      setStatus("Logged in successfully. Redirecting to swaps...");
      router.push(`/swap?demo=${match.flag}#preferences`);
      return;
    }

    setStatusType("error");
    setStatus("Incorrect email or password.");
  };

  return (
    <div className="min-h-screen bg-highlight text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/c4c.webp"
              alt="OffRamp logo"
              className="h-10 w-10 rounded border-2 border-black bg-white object-cover"
            />
            <div className="leading-tight">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">OffRamp</p>
              <p className="text-lg font-impact uppercase text-black">Sign In</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase text-black transition hover:scale-105 hover:bg-black hover:text-white"
          >
            ← Back home
          </Link>
        </div>

        <div className="bold-shadow w-full max-w-md rounded-[2.5rem] border-3 border-black bg-white p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-highlight">
              <span className="material-symbols-outlined text-xl">login</span>
            </div>
            <h1 className="font-impact text-3xl uppercase text-black">
              {isSignup ? "Create your account" : "Sign in with email"}
            </h1>
            <p className="text-sm font-semibold text-slate-600">
              {isSignup
                ? "Join OffRamp to save swaps and track impact."
                : "Access your swaps, favorites, and impact."}
            </p>
          </div>

          <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-4">
            {isSignup && (
              <label className="text-sm font-bold text-black">
                Name
                <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                  <span className="material-symbols-outlined text-lg text-slate-500">person</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </label>
            )}

            <label className="text-sm font-bold text-black">
              Email
              <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                <span className="material-symbols-outlined text-lg text-slate-500">mail</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </label>

            <label className="text-sm font-bold text-black">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                <span className="material-symbols-outlined text-lg text-slate-500">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-slate-500 transition hover:text-black"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
            </label>

            {isSignup && (
              <>
                <label className="text-sm font-bold text-black">
                  Phone
                  <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                    <span className="material-symbols-outlined text-lg text-slate-500">call</span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="text-sm font-bold text-black">
                  City
                  <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                    <span className="material-symbols-outlined text-lg text-slate-500">location_city</span>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Your city"
                      className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </label>
              </>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Forgot password?</span>
                <span className="text-primary">Reset</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-xl border-2 border-black bg-black px-5 py-3 text-sm font-bold uppercase text-white transition hover:-translate-y-[2px] hover:bg-accent hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              {isSignup ? "Create account" : "Get Started"}
            </button>
          </form>

          {status && (
            <div
              className={`fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border-2 px-4 py-3 text-sm font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                statusType === "success"
                  ? "border-emerald-700 bg-emerald-100 text-emerald-900"
                  : "border-red-700 bg-red-100 text-red-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    {statusType === "success" ? "check_circle" : "error"}
                  </span>
                  {status}
                </span>
                <button
                  type="button"
                  aria-label="Close alert"
                  className="text-xs text-current transition hover:opacity-70"
                  onClick={() => {
                    setStatus(null);
                    setStatusType(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Or {isSignup ? "sign up" : "sign in"} with
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className="rounded-xl border-2 border-black bg-white py-2 text-xs font-bold uppercase text-black transition hover:bg-black hover:text-white"
            >
              Google
            </button>
            <button
              type="button"
              className="rounded-xl border-2 border-black bg-white py-2 text-xs font-bold uppercase text-black transition hover:bg-black hover:text-white"
            >
              Facebook
            </button>
            <button
              type="button"
              className="rounded-xl border-2 border-black bg-white py-2 text-xs font-bold uppercase text-black transition hover:bg-black hover:text-white"
            >
              Apple
            </button>
          </div>

          <div className="mt-6 text-center text-xs font-semibold text-slate-600">
            {isSignup ? "Already have an account?" : "New here?"}
            <button
              type="button"
              onClick={() => setIsSignup((prev) => !prev)}
              className="ml-2 font-bold uppercase text-primary transition hover:text-accent"
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
