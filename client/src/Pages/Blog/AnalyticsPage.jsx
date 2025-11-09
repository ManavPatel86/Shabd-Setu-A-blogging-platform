import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    engagementRate: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [insight, setInsight] = useState("Generating insights...");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/analytics", {
        withCredentials: true,
      });
      setStats(res.data.overview);
      setTrendData(res.data.trends);
      setInsight(res.data.aiInsight);
    } catch (err) {
      console.error("Error loading analytics:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">My Blog Analytics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Total Views", value: stats.views, icon: "👁️" },
          { title: "Total Likes", value: stats.likes, icon: "❤️" },
          { title: "Total Comments", value: stats.comments, icon: "💬" },
          {
            title: "Engagement Rate",
            value: stats.engagementRate + "%",
            icon: "📈",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl shadow flex items-center justify-between"
          >
            <div>
              <h3 className="text-gray-600">{card.title}</h3>
              <p className="text-2xl font-bold mt-1">{card.value || 0}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#2563eb"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insights */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
        <p className="text-gray-700">{insight}</p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
