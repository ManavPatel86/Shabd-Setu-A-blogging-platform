import React, { useEffect, useState } from "react";
import axios from "axios";
import { getEnv } from "@/helpers/getEnv";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";

const StatCard = ({ title, value, sub, icon }) => (
  <div className="flex-1 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow p-5 flex items-center justify-between">
    <div>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      {sub ? <div className="text-xs text-gray-500 mt-1">{sub}</div> : null}
    </div>
    <div className="p-3 rounded-lg bg-white/60 ml-4">{icon}</div>
  </div>
);

const TopPostPanel = ({ top }) => {
  if (!top) return <div className="text-sm text-gray-500">No top post data.</div>;
  return (
    <div>
      <div className="font-medium text-gray-900">{top.title}</div>
      {top.views != null ? (
        <div className="text-xs text-gray-500 mt-1">{top.views} views</div>
      ) : null}
    </div>
  );
};

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    views: 0,
    uniqueViews: 0,
    likes: 0,
    comments: 0,
    engagementRate: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [insight, setInsight] = useState("Generating insights...");
  const [topBlog, setTopBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawBase = getEnv("VITE_API_BASE_URL") || "http://localhost:5000";
      const cleaned = rawBase.replace(/\/$/, "");
      const apiBase = cleaned.includes("/api") ? cleaned : `${cleaned}/api`;
      const url = `${apiBase}/analytics`;
      const res = await axios.get(url, { withCredentials: true });

      const overview = res.data.overview || {};
      overview.views = Number(overview.views || 0);
      overview.uniqueViews = Number(overview.uniqueViews || 0);
      overview.likes = Number(overview.likes || 0);
      overview.comments = Number(overview.comments || 0);
      overview.engagementRate = overview.engagementRate || "0";

      const trends = (res.data.trends || []).map((t) => ({
        date: t.date,
        views: Number(t.views || 0),
        likes: Number(t.likes || 0),
        comments: Number(t.comments || 0),
      }));

      setStats(overview);
      setTrendData(trends);
      setInsight(res.data.aiInsight || "No insights available.");
      setTopBlog(res.data.topBlog || null);
    } catch (err) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">My Blog Analytics</h2>
        <div className="text-sm text-gray-500">Updated just now</div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading analytics...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-6">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Views"
              value={stats.views}
              sub={`Unique: ${stats.uniqueViews}`}
              icon={<Eye className="h-6 w-6 text-indigo-600" />}
            />
            <StatCard
              title="Total Likes"
              value={stats.likes}
              icon={<Heart className="h-6 w-6 text-rose-600" />}
            />
            <StatCard
              title="Total Comments"
              value={stats.comments}
              icon={<MessageSquare className="h-6 w-6 text-emerald-600" />}
            />
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Engagement Rate</div>
                <div className="text-3xl font-extrabold mt-1">
                  {stats.engagementRate}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  (likes+comments)/views
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/60 ml-4">
                <TrendingUp className="h-6 w-6 text-indigo-500" />
              </div>
           </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Engagement Trends</h3>
              <div className="text-sm text-gray-500">Last 30 days</div>
            </div>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#2563eb"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="likes"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-16">
                No trend data available.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow">
              <h4 className="text-sm text-gray-500 mb-3">Top Post</h4>
              <TopPostPanel top={topBlog} />
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow">
              <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
              <p className="text-gray-700">{insight}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
