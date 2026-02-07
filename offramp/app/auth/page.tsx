"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import bg from "@/public/assets/bg.jpg";
import dishRoll from "@/public/assets/dish-roll.jpg";

export default function AuthPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setStatusType(null);
    setIsSubmitting(true);

    const payload: Record<string, string> = {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    };

    if (isSignup) {
      payload.fullName = name.trim();
      if (phone.trim()) payload.phone = phone.trim();
      if (city.trim()) payload.city = city.trim();
      if (region.trim()) payload.region = region.trim();
    }

    try {
      const response = await fetch(isSignup ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        // Ignore JSON parse errors here; we handle below.
      }

      if (!response.ok) {
        const message = result?.error || "Authentication failed";
        throw new Error(message);
      }

      setStatusType("success");
      setStatus(result?.message || (isSignup ? "Account created successfully" : "Logged in"));

      setTimeout(() => {
        router.push("/swap");
      }, 300);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setStatusType("error");
      setStatus(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const backgroundImage = bg.src;
  const fallbackBackgroundImage = bg.src;
  const circleImage = dishRoll.src;
  const fallbackCircleImage = dishRoll.src;

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <picture className="block h-full w-full">
          <source srcSet={backgroundImage} />
          <img
            src={fallbackBackgroundImage}
            alt="Plant-powered background"
            className="h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-emerald-900/40 to-black/65 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex min-h-screen items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:px-12">
        <div className="relative w-full max-w-6xl overflow-hidden rounded-[48px] border border-white/15 bg-white/10 p-6 shadow-[0_50px_150px_rgba(0,0,0,0.55)] backdrop-blur-[50px]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)] opacity-40"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-stretch">
            <section className="flex flex-1 flex-col items-center justify-center gap-8 rounded-[32px] border border-white/20 bg-white/5 p-6 text-white shadow-inner">
              <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[320px] sm:w-[320px]">
                <div className="absolute inset-0 rounded-full border border-white/60 opacity-90" aria-hidden="true" />
                <div className="absolute inset-6 rounded-full border border-white/30 opacity-70" aria-hidden="true" />
                <div className="absolute -inset-8 rounded-full bg-emerald-400/25 blur-3xl" aria-hidden="true" />
                <picture className="relative z-10 block h-full w-full">
                  <source srcSet={circleImage} />
                  <img
                    src={fallbackCircleImage}
                    alt="Signature OffRamp swap"
                    className="rotating-orb h-full w-full rounded-full border-[12px] border-white/90 object-cover shadow-[0_45px_140px_rgba(5,10,10,0.55)]"
                  />
                </picture>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Comfort-first swaps</p>
                <p className="mt-3 text-4xl font-impact uppercase leading-tight">Pick your entry point</p>
                <p className="mt-3 max-w-sm text-sm text-white/80">
                  The rotating plate mirrors the reference layout. Tap the card on the right to flip between login and register without losing flow.
                </p>
              </div>
            </section>

            <section className="flex flex-1">
              <div className="relative w-full rounded-[32px] border border-black/10 bg-white/95 p-6 shadow-2xl sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/c4c.webp"
                      alt="OffRamp logo"
                      className="h-10 w-10 rounded border-2 border-black bg-white object-cover"
                    />
                    <div className="leading-tight">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">OffRamp</p>
                      <p className="text-lg font-impact uppercase text-black">{isSignup ? "Register" : "Login"}</p>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-bold uppercase text-black transition hover:scale-105 hover:bg-black hover:text-white"
                  >
                    ← Back home
                  </Link>
                </div>

                {status && (
                  <div
                    className={`mb-4 rounded-2xl border-2 px-4 py-3 text-sm font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                      statusType === "success"
                        ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                        : "border-red-700 bg-red-50 text-red-900"
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

                <div className="flip-stage mt-8">
                  <div className={`flip-card ${isSignup ? "flip-card--signup" : ""}`}>
                <section className={`flip-face flip-face--front ${isSignup ? "flip-face--hidden" : ""}`}>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-highlight">
                      <span className="material-symbols-outlined text-xl">login</span>
                    </div>
                    <h1 className="font-impact text-3xl uppercase text-black">Sign in with email</h1>
                    <p className="text-sm font-semibold text-slate-600">Access your swaps, favorites, and impact.</p>
                  </div>

                  <form onSubmit={handleAuth} className="mt-6 flex flex-col gap-4">
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

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Forgot password?</span>
                      <span className="text-primary">Reset</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 inline-flex items-center justify-center rounded-xl border-2 border-black bg-black px-5 py-3 text-sm font-bold uppercase text-white transition hover:-translate-y-[2px] hover:bg-accent hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-black disabled:hover:shadow-none"
                    >
                      {isSubmitting ? "Please wait..." : "Get Started"}
                    </button>
                  </form>

                  <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    Or sign in with
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
                    New here?
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="ml-2 font-bold uppercase text-primary transition hover:text-accent"
                    >
                      Create account
                    </button>
                  </div>
                </section>

                <section className={`flip-face flip-face--back ${isSignup ? "" : "flip-face--hidden"}`}>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-highlight">
                      <span className="material-symbols-outlined text-xl">stylus_note</span>
                    </div>
                    <h1 className="font-impact text-3xl uppercase text-black">Create your account</h1>
                    <p className="text-sm font-semibold text-slate-600">Join OffRamp to save swaps and track impact.</p>
                  </div>

                  <form onSubmit={handleAuth} className="mt-6 flex flex-col gap-4">
                    <label className="text-sm font-bold text-black">
                      Full name
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

                    <label className="text-sm font-bold text-black">
                      Phone (optional)
                      <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                        <span className="material-symbols-outlined text-lg text-slate-500">call</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 555 123 4567"
                          className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </label>

                    <label className="text-sm font-bold text-black">
                      City (optional)
                      <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                        <span className="material-symbols-outlined text-lg text-slate-500">location_city</span>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Your city"
                          className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </label>

                    <label className="text-sm font-bold text-black">
                      Region (optional)
                      <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3 py-2">
                        <span className="material-symbols-outlined text-lg text-slate-500">public</span>
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="e.g. South India"
                          className="w-full bg-transparent text-sm text-black placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 inline-flex items-center justify-center rounded-xl border-2 border-black bg-black px-5 py-3 text-sm font-bold uppercase text-white transition hover:-translate-y-[2px] hover:bg-accent hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-black disabled:hover:shadow-none"
                    >
                      {isSubmitting ? "Please wait..." : "Create account"}
                    </button>
                  </form>

                  <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    Or sign up with
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
                    Already have an account?
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="ml-2 font-bold uppercase text-primary transition hover:text-accent"
                    >
                      Sign in
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
          </div>
        </div>
      </div>
    </div>
  );
}
