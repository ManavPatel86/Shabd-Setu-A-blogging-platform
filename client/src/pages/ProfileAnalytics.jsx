import React, { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import BackButton from '@/components/BackButton'
import { getEnv } from '@/helpers/getEnv'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

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
  const navigate = useNavigate()

  const apiBase = import.meta.env.VITE_API_BASE_URL || getEnv('VITE_API_BASE_URL')
  // Fallback backend to try when the configured API base points to the Vite frontend server
  // (common when env was set to http://localhost:3000/api). We default to port 5000.
  const fallback = (() => {
    try {
      if (!apiBase) return 'http://localhost:5000/api'
      if (apiBase.includes(':3000')) return apiBase.replace(':3000', ':5000')
      return 'http://localhost:5000/api'
    } catch (e) {
      return 'http://localhost:5000/api'
    }
  })()


  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        // Try primary apiBase first. If it points to the frontend (vite) server
        // or returns 404, attempt a sensible backend fallback (localhost:5000).
        let res
        try {
          res = await axios.get(`${apiBase}/analytics`, { withCredentials: true })
        } catch (err) {
      
          try {
            res = await axios.get(`${fallback}/analytics`, { withCredentials: true })
          } catch (err2) {
            throw err2 || err
          }
        }
        setData(res.data)
      } catch (err) {
        setError(err?.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [apiBase])

  const { overview = {}, breakdown = {}, trends = [], aiInsight, topBlog } = data || {}

  const engagementTrend = useMemo(() => {
    if (!Array.isArray(trends)) return []
    return trends.map((point) => {
      const views = Number(point?.views) || 0
      const likes = Number(point?.likes) || 0
      const comments = Number(point?.comments) || 0
      const engagement = views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0
      return { date: point?.date, engagement }
    })
  }, [trends])

  const averageEngagement = useMemo(() => {
    if (!engagementTrend.length) return 0
    const total = engagementTrend.reduce((sum, point) => sum + point.engagement, 0)
    return Number((total / engagementTrend.length).toFixed(2))
  }, [engagementTrend])

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

  if (loading) return <div className="p-6">Loading analytics...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!data) return null

  return (
    <div className="p-6">
      <BackButton className="mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Your Analytics</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Views" value={overview.views || 0} />
        <Stat label="Unique Views" value={overview.uniqueViews || 0} />
        <Stat label="Total Likes" value={overview.likes || 0} />
        <Stat label="Total Comments" value={overview.comments || 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {pieFor('uniqueViews', 'Unique Views: Followers vs Non-followers')}
        <div className="xl:col-span-2 bg-white p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
                <div className="text-sm text-slate-600">Engagement Trends (last 30 days)</div>
                  <div className="text-xs text-slate-400">Daily views, likes, and comments</div>
            </div>
          </div>
          {trends && trends.length ? (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#6C5CE7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">Not enough data to chart engagement yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-2">Insights</h3>
          <p className="text-slate-700">{aiInsight}</p>
          {topBlog ? <p className="mt-3 text-sm text-slate-500">Top post: {topBlog.title} — {topBlog.views} views</p> : null}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow">
          <h4 className="text-sm text-slate-500 mb-1">Engagement Rate</h4>
          <div className="text-3xl font-bold text-[#6C5CE7]">{overview.engagementRate}%</div>
          <p className="mt-2 text-xs text-slate-500">Average (30-day): {averageEngagement}%</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileAnalytics
