"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function DriverAnalyticsPage() {
  const { data: session } = useSession();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!session?.user?._id) return;

        setLoading(true);

        const res = await fetch(
          `/api/analytics/driver/${session.user._id}`
        );

        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.log("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 text-red-500">
        Failed to load analytics
      </div>
    );
  }

  const growthColor =
    analytics.weeklyStats?.growthPercent >= 0
      ? "text-green-600"
      : "text-red-600";

  const earningsData = analytics.earningsChart || [];
  const heatData = analytics.hourlyHeatmap || [];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* NAVBAR (FIXED OVERLAY ISSUE) */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <div className="p-6 space-y-6">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Driver Analytics Dashboard
          </h1>
          <p className="text-gray-500">
            Performance insights & earnings overview
          </p>
        </motion.div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

          {[
            {
              label: "Earnings",
              value: `₹ ${analytics.totalEarnings || 0}`,
            },
            {
              label: "Completed",
              value: analytics.completedTrips || 0,
            },
            {
              label: "Cancelled",
              value: analytics.cancelledTrips || 0,
            },
            {
              label: "Rating",
              value: `⭐ ${analytics.averageRating || 5}`,
            },
            {
              label: "Score",
              value: analytics.performanceScore || 0,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="
                bg-white p-4 rounded-2xl
                border shadow-sm
              "
            >
              <p className="text-sm text-gray-500">
                {item.label}
              </p>
              <h2 className="text-2xl font-bold mt-1">
                {item.value}
              </h2>
            </motion.div>
          ))}
        </div>

        {/* WEEKLY STATS */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="font-semibold text-lg mb-4">
            Weekly Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <p className="text-gray-500 text-sm">This Week</p>
              <h3 className="text-2xl font-bold">
                ₹ {analytics.weeklyStats?.thisWeekEarnings || 0}
              </h3>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Last Week</p>
              <h3 className="text-2xl font-bold">
                ₹ {analytics.weeklyStats?.lastWeekEarnings || 0}
              </h3>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Growth</p>
              <h3 className={`text-2xl font-bold ${growthColor}`}>
                {analytics.weeklyStats?.growthPercent || 0}%
              </h3>
            </div>

          </div>
        </div>

        {/* EARNINGS CHART (FIXED STABLE SIZE) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="font-semibold text-lg mb-4">
            Earnings Trend
          </h2>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "10px",
                    border: "none",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#111827"
                  strokeWidth={2}
                  fill="url(#earnings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HOURLY CHART (FIXED SIZE + CLEAN UI) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="font-semibold text-lg mb-4">
            Peak Driving Hours
          </h2>

          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatData}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111827" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#111827" stopOpacity={0.3} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => `${h}:00`}
                  tick={{ fontSize: 12 }}
                />

                <YAxis tick={{ fontSize: 12 }} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    borderRadius: "10px",
                    border: "none",
                    color: "#fff",
                  }}
                />

                <Bar
                  dataKey="trips"
                  fill="url(#bar)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}