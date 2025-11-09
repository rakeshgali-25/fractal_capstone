// DashboardPage.jsx
import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import KpiCard from "../../components/ui/KpiCard";
import { Line, Doughnut } from "react-chartjs-2";
import api from "../../services/api"; // ✅ use your axios instance
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "../../styles/dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const DEFAULT_COLORS = [
  "#7C4DFF",
  "#2E86FF",
  "#00C2A8",
  "#FFB86B",
  "#A3A3A3",
  "#E45756",
  "#6A4C93",
];

const ACT_COLORS = {
  Walking: "#7C4DFF",
  Running: "#2E86FF",
  Cycling: "#00C2A8",
  Yoga: "#FFB86B",
  "Gym Workout": "#A3A3A3",
  Other: "#BDBDBD",
};

function hexToRgba(hex, alpha = 0.2) {
  const h = (hex || "#888888").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function normalizeActivityName(name) {
  if (!name) return "Other";
  return String(name).trim().replace(/\s+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/api/dashboard/");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard API failed:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="empty">Loading dashboard...</div>;
  if (error) return <div className="empty error">{error}</div>;
  if (!data) return <div className="empty">No data available.</div>;

  const { summary, weekly_activity_stats = [], activity_share = [], recent_activity = [] } = data;

  // Build labels dynamically from data length (fallback to 7)
  const daysCount = weekly_activity_stats.length ? (weekly_activity_stats[0].data || []).length : 7;
  const defaultDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = Array.from({ length: daysCount }).map((_, i) => defaultDayNames[i % defaultDayNames.length]);

  // --- Normalize and aggregate weekly_activity_stats ---
  // Convert incoming weekly_activity_stats ( [{activity, data:[...]}, ...] ) into:
  // 1) normalized map activity -> data array
  // 2) totals per activity (for picking top contributors)
  const normalizedMap = {};
  weekly_activity_stats.forEach((entry) => {
    const name = normalizeActivityName(entry.activity);
    const arr = Array.from({ length: daysCount }).map((__, i) => Number((entry.data && entry.data[i]) || 0));
    if (!normalizedMap[name]) normalizedMap[name] = arr;
    else {
      // merge arrays (sum values if duplicates)
      for (let i = 0; i < daysCount; i++) normalizedMap[name][i] = (normalizedMap[name][i] || 0) + (arr[i] || 0);
    }
  });

  // compute totals & sort descending
  const totals = Object.keys(normalizedMap).map((k) => ({
    activity: k,
    total: normalizedMap[k].reduce((s, v) => s + Number(v || 0), 0),
    data: normalizedMap[k],
  }));
  totals.sort((a, b) => b.total - a.total);

  // choose top N series to show; fold the rest into "Other"
  const TOP_N = 6;
  const top = totals.slice(0, TOP_N);
  const others = totals.slice(TOP_N);

  // build datasets for chart
  const datasets = top.map((t, idx) => {
    const color = ACT_COLORS[t.activity] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    return {
      label: t.activity,
      data: t.data.map((v) => Math.round(Number(v || 0))),
      fill: true,
      tension: 0.25,
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.18),
      borderWidth: 2,
      pointRadius: 2,
    };
  });

  // merge others into a single "Other" series (if any)
  if (others.length > 0) {
    const otherData = new Array(daysCount).fill(0);
    others.forEach((o) => {
      for (let i = 0; i < daysCount; i++) otherData[i] += Number(o.data[i] || 0);
    });
    const color = ACT_COLORS.Other || DEFAULT_COLORS[DEFAULT_COLORS.length - 1];
    datasets.push({
      label: "Other",
      data: otherData.map((v) => Math.round(Number(v || 0))),
      fill: true,
      tension: 0.25,
      borderColor: color,
      backgroundColor: hexToRgba(color, 0.18),
      borderWidth: 2,
      pointRadius: 2,
    });
  }

  const lineData = {
    labels: days,
    datasets,
  };

  const lineOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "rgba(255,255,255,0.85)" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} kcal`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "rgba(255,255,255,0.65)" },
      },
      y: {
        stacked: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "rgba(255,255,255,0.65)" },
        title: {
          display: true,
          text: "Calories (kcal)",
          color: "rgba(255,255,255,0.7)",
        },
      },
    },
    maintainAspectRatio: false,
  };

  // Doughnut: pick same top contributors (use activity_share but normalize & fold)
  // build a normalized activity_share map
  const shareMap = {};
  activity_share.forEach((s) => {
    const name = normalizeActivityName(s.activity);
    shareMap[name] = (shareMap[name] || 0) + Number(s.calories || 0);
  });

  // convert shareMap to array and sort same as totals
  const shareArr = Object.keys(shareMap).map((k) => ({ activity: k, calories: shareMap[k] }));
  shareArr.sort((a, b) => b.calories - a.calories);
  const topShare = shareArr.slice(0, TOP_N);
  const otherShare = shareArr.slice(TOP_N);
  let otherShareTotal = 0;
  otherShare.forEach((o) => (otherShareTotal += o.calories || 0));
  const finalShare = topShare.slice();
  if (otherShareTotal > 0) finalShare.push({ activity: "Other", calories: otherShareTotal });

  const doughnutData = {
    labels: finalShare.map((s) => s.activity),
    datasets: [
      {
        data: finalShare.map((s) => Math.round(Number(s.calories || 0))),
        backgroundColor: finalShare.map((s, i) => ACT_COLORS[s.activity] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
        hoverOffset: 6,
      },
    ],
  };

  return (
    <>
      <div className="kpi-row">
        <KpiCard
          title="Calories (Today)"
          value={`${Math.round(summary.calories_today || 0)}`}
          unit="kcal"
          subtitle="Total from all activities"
        />
        <KpiCard
          title="Active Minutes"
          value={summary.active_minutes_today || 0}
          unit="min"
          subtitle="Today"
        />
        <KpiCard title="Steps" value={(summary.steps_today || 0).toLocaleString()} subtitle="Today" />
        <KpiCard
          title="Goals"
          value={`${summary.completed_goals || 0}/${summary.total_goals || 0}`}
          subtitle="Completed"
        />
      </div>

      <div className="charts-row improved">
        <div className="chart-card chart-large">
          <div className="card-head">
            <strong>Calories burned — stacked by activity</strong>
          </div>
          <div style={{ height: 360 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        <div className="right-column">
          <div className="chart-card">
            <div className="card-head">
              <strong>Activity share (kcal)</strong>
            </div>
            <div style={{ height: 220 }}>
              <Doughnut
                data={doughnutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "rgba(255,255,255,0.8)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="card recent-card">
            <div className="card-head">
              <strong>Recent Activity</strong>
            </div>
            <ul className="recent-list">
              {recent_activity.map((r, i) => (
                <li key={i}>
                  <b>{r.activity}</b> — <span className="muted">{r.date}</span>{" "}
                  <span style={{ float: "right" }}>{r.calories} kcal</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
