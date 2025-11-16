// AdminReports.jsx
// Admin page for managing blog reports
import React, { useEffect, useState, useMemo } from 'react';
import { getEnv } from '@/helpers/getEnv';
import { showToast } from '@/helpers/showToast';
import { Link } from 'react-router-dom';
import { RouteProfileView } from '@/helpers/RouteName';
import { 
  Flag, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Ban, 
  Eye,
  User as UserIcon,
  ChevronDown,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
    safe: 'bg-green-100 text-green-800 border-green-300',
    removed: 'bg-red-100 text-red-800 border-red-300',
    banned: 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const getReportTypeColor = (type) => {
  const colors = {
    'Hate speech': 'bg-red-100 text-red-800 border-red-300',
    'Spam': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Harassment': 'bg-red-100 text-red-800 border-red-300',
    'NSFW': 'bg-orange-100 text-orange-800 border-orange-300',
    'Fake Info': 'bg-blue-100 text-blue-800 border-blue-300',
    'Other': 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/report/admin/reports`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reports');
      setReports(data);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, status) => {
    setUpdating(reportId);
    try {
      let url = `${getEnv('VITE_API_BASE_URL')}/report/admin/report/${reportId}`;
      if (status === 'safe') url += '/safe';
      else if (status === 'removed') url += '/remove';
      else if (status === 'banned') url += '/ban';
      else if (status === 'resolved') url += '/resolve';

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');
      showToast('success', 'Status updated successfully');
      fetchReports();
    } catch (err) {
      showToast('error', err.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;

    return { total, pending, resolved };
  }, [reports]);

  // Filter reports based on status filter
  const filteredReports = useMemo(() => {
    if (statusFilter === 'all') return reports;
    return reports.filter(r => r.status === statusFilter);
  }, [reports, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Flag className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Reports</h1>
          </div>
          <p className="text-gray-600">Review and manage flagged blog content</p>
        </div>

        {/* Statistics Cards - Only 3 */}
        {reports.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Reports</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Flag className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Resolved</p>
                    <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Buttons */}
        {reports.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => setStatusFilter('safe')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'safe'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Safe
            </button>
            <button
              onClick={() => setStatusFilter('removed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'removed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Removed
            </button>
            <button
              onClick={() => setStatusFilter('banned')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'banned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Banned
            </button>
          </div>
        )}

        {/* Report Cards */}
        {filteredReports.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'All blogs are looking good!' 
                  : `No ${statusFilter} reports found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((r) => (
              <Card key={r._id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Header with Status and Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>

                  {/* Report Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Reported Blog */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Reported Blog:</p>
                      <Link 
                        to={`/blog/${r.blogId?.slug || r.blogId?._id}`} 
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="line-clamp-1">{r.blogId?.title || 'Unknown Blog'}</span>
                      </Link>
                    </div>

                    {/* Reporter */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Reporter:</p>
                      <Link 
                        to={RouteProfileView(r.reporterId?._id)} 
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>{r.reporterId?.name || r.reporterId?.email || r.reporterId?._id || 'Unknown User'}</span>
                      </Link>
                    </div>

                    {/* Report Type */}
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">Report Type:</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getReportTypeColor(r.type)}`}>
                        {r.type}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100"
                    >
                      Safe
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(r._id, 'safe')}
                      disabled={updating === r._id || r.status === 'safe'}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    >
                      {updating === r._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3" />
                      )}
                      Mark Safe
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(r._id, 'removed')}
                      disabled={updating === r._id || r.status === 'removed'}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    >
                      {updating === r._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Remove Blog
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(r._id, 'banned')}
                      disabled={updating === r._id || r.status === 'banned'}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                    >
                      {updating === r._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Ban className="w-3 h-3" />
                      )}
                      Ban User
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(r._id, 'resolved')}
                      disabled={updating === r._id || r.status === 'resolved'}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      {updating === r._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
