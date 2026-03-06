import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdminClient";

export const revalidate = 300;

type LandingMetrics = {
  total_users: number;
  total_swaps: number;
  active_users_today: number;
  weekly_swaps: number;
  live_swaps: number;
};

const defaultMetrics: LandingMetrics = {
  total_users: 0,
  total_swaps: 0,
  active_users_today: 0,
  weekly_swaps: 0,
  live_swaps: 0,
};

const toIso = (date: Date) => date.toISOString();

/**
 * SQL migration required if execute_sql RPC is unavailable:
 *
 * CREATE OR REPLACE VIEW public.total_users_view AS
 * SELECT COUNT(*)::int AS total_users
 * FROM auth.users;
 */
async function getTotalUsers(): Promise<number> {
  const admin = getSupabaseAdminClient();

  // Prefer raw SQL (if project provides execute_sql RPC)
  const { data: usersCountData, error: usersRpcError } = await admin.rpc("execute_sql", {
    query: "SELECT COUNT(*)::int AS total_users FROM auth.users",
  });

  if (!usersRpcError && Array.isArray(usersCountData) && usersCountData.length > 0) {
    const value = Number((usersCountData[0] as { total_users?: unknown }).total_users);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  // Fallback: query the view (create it using the SQL above).
  const { data: usersCountView, error: usersViewError } = await admin
    .from("total_users_view")
    .select("total_users")
    .single();

  if (!usersViewError) {
    const value = Number((usersCountView as { total_users?: unknown } | null)?.total_users);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [totalUsers, totalSwapsRes, activeUsersTodayRes, weeklySwapsRes, liveSwapsRes] = await Promise.all([
      getTotalUsers(),
      admin.from("user_swaps").select("id", { count: "exact", head: true }),
      admin
        .from("user_swaps")
        .select("user_id")
        .gte("created_at", toIso(startOfToday)),
      admin
        .from("user_swaps")
        .select("id", { count: "exact", head: true })
        .gte("created_at", toIso(sevenDaysAgo)),
      admin
        .from("user_swaps")
        .select("id", { count: "exact", head: true })
        .gte("created_at", toIso(fiveMinutesAgo)),
    ]);

    const response: LandingMetrics = {
      total_users: totalUsers,
      total_swaps: totalSwapsRes.error ? 0 : totalSwapsRes.count ?? 0,
      active_users_today: activeUsersTodayRes.error
        ? 0
        : new Set((activeUsersTodayRes.data ?? []).map((row) => row.user_id)).size,
      weekly_swaps: weeklySwapsRes.error ? 0 : weeklySwapsRes.count ?? 0,
      live_swaps: liveSwapsRes.error ? 0 : liveSwapsRes.count ?? 0,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(defaultMetrics);
  }
}
