import React, { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { getEnv } from '@/helpers/getEnv'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import { RouteProfile } from '@/helpers/RouteName'

const COLORS = ['#6C5CE7', '#A0AEC0']

const Stat = ({ label, value }) => (
  <div className="bg-white p-4 rounded-2xl shadow">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
)

const ProfileAnalytics = () => {
  const user = useSelector((state) => state.user?.user)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const apiBase = useMemo(() => {
    const raw = getEnv('VITE_API_BASE_URL') || 'http://localhost:5000'
    const cleaned = raw.replace(/\/$/, '')
    return cleaned.includes('/api') ? cleaned : `${cleaned}/api`
  }, [])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${apiBase}/analytics`, { withCredentials: true })
        setData(res.data)
      } catch (err) {
        setError(err?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [apiBase])

  if (loading) return <div className="p-6">Loading analytics...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return null

  const { overview, breakdown, trends, aiInsight, topBlog } = data

  const pieFor = (metricKey, title) => {
    const m = breakdown && breakdown[metricKey]
    const followers = m ? m.followers : 0
    const nonFollowers = m ? m.nonFollowers : 0
    const pieData = [ { name: 'Followers', value: followers }, { name: 'Non-followers', value: nonFollowers } ]
    return (
      <div className="bg-white p-4 rounded-2xl shadow">
        <div className="text-sm text-slate-600 mb-2">{title}</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={4}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Analytics</h2>
        <Link to={RouteProfile} className="text-sm text-slate-500">Back to profile</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Views" value={overview.views || 0} />
        <Stat label="Unique Views" value={overview.uniqueViews || 0} />
        <Stat label="Total Likes" value={overview.likes || 0} />
        <Stat label="Total Comments" value={overview.comments || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pieFor('uniqueViews', 'Unique Views: Followers vs Non-followers')}
        {pieFor('likes', 'Likes: Followers vs Non-followers')}
        {pieFor('comments', 'Comments: Followers vs Non-followers')}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Engagement Trends (last 30 days)</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#6C5CE7" strokeWidth={2} />
              <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
          <p className="text-slate-700">{aiInsight}</p>
          {topBlog ? <p className="mt-3 text-sm text-slate-500">Top post: {topBlog.title} — {topBlog.views} views</p> : null}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h4 className="text-sm text-slate-500 mb-3">Engagement Rate</h4>
          <div className="text-3xl font-bold">{overview.engagementRate}%</div>
        </div>
      </div>
    </div>
  )
}

export default ProfileAnalytics
