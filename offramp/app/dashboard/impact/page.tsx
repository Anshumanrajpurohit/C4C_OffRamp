"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ImpactData = {
  meals: number;
  co2_saved_kg: number;
  water_saved_liters: number;
  money_saved_inr: number;
};

function ImpactCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}>
      <p className="text-xs font-bold uppercase tracking-widest text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-black" style={{ color: "var(--color-primary)" }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-secondary">{hint}</p>
    </div>
  );
}

export default function DashboardImpactPage() {
  const router = useRouter();
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        if (!sessionRes.ok) {
          if (active) {
            router.replace("/auth");
            setError("Login required.");
            setLoading(false);
          }
          return;
        }

        const impactRes = await fetch("/api/dashboard/impact", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await impactRes.json();

        if (!active) return;
        if (!impactRes.ok) {
          setError(payload?.error || "Failed to load impact.");
          return;
        }
        setData(payload);
      } catch {
        if (active) setError("Failed to load impact.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-secondary hover:underline mb-2 inline-block">
          ← Dashboard
        </Link>
        <h1 className="text-5xl font-black uppercase tracking-tight" style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}>
          Impact
        </h1>
        <p className="text-sm text-secondary mt-1">Your measurable transition impact so far.</p>
      </div>

      {loading && <div className="text-center text-secondary py-16 text-sm">Loading…</div>}

      {error && !loading && (
        <div className="rounded-2xl bg-red-50 border border-red-300 p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-5">
          {data.meals === 0 ? (
            <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}>
              <p className="text-sm text-secondary">No impact yet. Record your first swap to start tracking.</p>
              <Link
                href="/swap"
                className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Go to Food Swap
              </Link>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <ImpactCard label="Meals Replaced" value={data.meals.toLocaleString()} hint="Total swaps you have recorded" />
            <ImpactCard label="CO2 Saved" value={`${data.co2_saved_kg.toLocaleString()} kg`} hint="Estimated emissions reduction" />
            <ImpactCard label="Water Saved" value={`${data.water_saved_liters.toLocaleString()} L`} hint="Estimated freshwater savings" />
            <ImpactCard label="Money Saved" value={`₹${data.money_saved_inr.toLocaleString()}`} hint="Estimated savings from swap choices" />
          </div>
        </div>
      )}
    </main>
  );
}
