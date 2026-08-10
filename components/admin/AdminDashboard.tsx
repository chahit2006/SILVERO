"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/format";

type Stats = {
  overview: { todayRevenue: number; ordersToday: number; pendingOrders: number; lowStock: number };
  salesSeries: { date: string; revenue: number }[];
  topProducts: { id: string; name: string; units: number }[];
  categoryBreakdown: { id: string; name: string; revenue: number }[];
};

const PERIODS = [7, 30, 90] as const;
const PIE_COLORS = ["#3A3820", "#8A8560", "#C9C4A8", "#5C5A3C", "#D8CFC0", "#7A7654"];

// ADMIN_PANEL_SPEC.md §2 — overview cards, sales graph (7/30/90d toggle),
// top products, category breakdown. Data from /api/admin/stats.
export function AdminDashboard() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?days=${days}`)
      .then((res) => res.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Today's Revenue" value={stats ? formatPrice(stats.overview.todayRevenue) : "—"} />
        <StatCard label="Orders Today" value={stats?.overview.ordersToday ?? "—"} />
        <StatCard label="Pending Orders" value={stats?.overview.pendingOrders ?? "—"} />
        <StatCard label="Low Stock (< 5)" value={stats?.overview.lowStock ?? "—"} warn={Boolean(stats?.overview.lowStock)} />
      </div>

      <div className="rounded-card border border-black/10 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-lg">Revenue</p>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setDays(p)}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                  days === p ? "bg-olive-dark text-ivory" : "border border-black/15 text-text-dark/60"
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {stats && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.salesSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={60} />
                <Tooltip formatter={(v) => formatPrice(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#3A3820" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-card border border-black/10 p-5">
          <p className="mb-4 font-display text-lg">Top Products</p>
          {stats && stats.topProducts.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 24 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#3A3820" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-text-dark/40">No sales in this period yet.</p>
          )}
        </div>

        <div className="rounded-card border border-black/10 p-5">
          <p className="mb-4 font-display text-lg">Category Breakdown</p>
          {stats && stats.categoryBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.categoryBreakdown} dataKey="revenue" nameKey="name" innerRadius={50} outerRadius={80}>
                    {stats.categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.id} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatPrice(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-text-dark/40">No sales in this period yet.</p>
          )}
        </div>
      </div>

      {loading && !stats && <p className="text-sm text-text-dark/40">Loading…</p>}
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`rounded-card border p-4 ${warn ? "border-red-200 bg-red-50" : "border-black/10"}`}>
      <p className={`font-display text-2xl ${warn ? "text-red-700" : ""}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-text-dark/50">{label}</p>
    </div>
  );
}
