"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SwapItem = {
  id: string;
  fromDish: string;
  toDish: string;
  fromCategory: string | null;
  toCategory: string | null;
  rating: number | null;
  imageUrl: string | null;
  createdAt: string;
  reviewText?: string | null;
};

export default function MySwapsPage() {
  const router = useRouter();
  const [swaps, setSwaps] = useState<SwapItem[]>([]);
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
            setError("Login required.");
            setLoading(false);
            router.replace("/auth");
          }
          return;
        }

        const swapsRes = await fetch("/api/swaps/recent?limit=50", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await swapsRes.json();

        if (!active) return;
        if (!swapsRes.ok) {
          setError(payload?.error || "Failed to load swaps.");
          return;
        }

        setSwaps(Array.isArray(payload?.swaps) ? payload.swaps : []);
      } catch {
        if (active) {
          setError("Failed to load swaps.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-secondary hover:underline mb-2 inline-block">
            ← Dashboard
          </Link>
          <h1
            className="text-5xl font-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-impact)", color: "var(--color-primary)" }}
          >
            My Swaps
          </h1>
          <p className="text-sm text-secondary mt-1">Your recorded swaps and submitted ratings.</p>
        </div>
      </div>

      {loading && <div className="text-center text-secondary py-16 text-sm">Loading…</div>}

      {error && !loading && (
        <div className="rounded-2xl bg-red-50 border border-red-300 p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && swaps.length === 0 && (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--color-primary)", background: "var(--color-highlight)" }}>
          <p className="text-sm text-secondary">No swaps yet. Go to Food Swap and tap Swap Now.</p>
          <Link
            href="/swap"
            className="mt-4 inline-block rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Go to Food Swap
          </Link>
        </div>
      )}

      {!loading && !error && swaps.length > 0 && (
        <div className="space-y-3">
          {swaps.map((swap) => (
            <div key={swap.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex gap-3">
                {swap.imageUrl ? (
                  <img
                    src={swap.imageUrl}
                    alt={swap.toDish}
                    className="h-14 w-14 rounded-xl border object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {swap.fromDish} → {swap.toDish}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(swap.createdAt).toLocaleString()}</p>
                  {(swap.fromCategory || swap.toCategory) && (
                    <p className="mt-1 text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
                      {swap.fromCategory || "unknown"} → {swap.toCategory || "unknown"}
                    </p>
                  )}
                  {typeof swap.rating === "number" && (
                    <p className="mt-1 text-xs text-slate-600">Rating: {swap.rating}/5</p>
                  )}
                  {swap.reviewText ? (
                    <p className="mt-1 text-sm text-slate-700">{swap.reviewText}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
