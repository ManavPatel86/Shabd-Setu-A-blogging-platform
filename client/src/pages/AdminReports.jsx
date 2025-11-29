// Admin report management page rebuilt to reflect the new moderation flow
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import {
  Flag,
  ShieldCheck,
  Ban,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { getEnv } from '@/helpers/getEnv';
import { showToast } from '@/helpers/showToast';
import { RouteProfileView, RouteBlogDetails } from '@/helpers/RouteName';

const ADMIN_ROUTE_FALLBACK = '/blog';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const resolveBlogLink = (blog) => {
  if (!blog) return ADMIN_ROUTE_FALLBACK;
  const categorySlug = blog.categories?.find((cat) => cat?.slug)?.slug;
  if (blog.slug && categorySlug) {
    return RouteBlogDetails(categorySlug, blog.slug);
  }
  return blog.slug ? `/blog/${blog.slug}` : ADMIN_ROUTE_FALLBACK;
};

const displayName = (user) => {
  if (!user) return 'Unknown user';
  return user.name || user.username || user.email || 'Unknown user';
};

const parseReportsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.reports)) return payload.reports;
  return [];
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/report/admin/reports`, {
          credentials: 'include',
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to fetch reports');
        }
        if (isMounted) {
          setReports(parseReportsPayload(payload));
        }
      } catch (error) {
        if (isMounted) {
          setReports([]);
        }
        showToast('error', error.message || 'Unable to load reports');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = async (reportId, action) => {
    if (!reportId || !action) return;
    setProcessingId(reportId);

    const url = `${getEnv('VITE_API_BASE_URL')}/report/admin/report/${reportId}/${action}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to process report');
      }

      setReports((prev) => prev.filter((report) => report.id !== reportId && report._id !== reportId));
      showToast('success', payload.message || 'Action completed.');
    } catch (error) {
      showToast('error', error.message || 'Unable to process report');
    } finally {
      setProcessingId(null);
    }
  };

  const totalReports = reports.length;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <BackButton className="mb-4" />
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Flag className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Report Center</h1>
              <p className="text-sm text-slate-600">Review flagged content and resolve reports in one place.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="size-5 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Open Reports</p>
              <p className="text-lg font-semibold text-slate-900">{totalReports}</p>
            </div>
          </div>
        </header>

        {loading ? (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="size-8 animate-spin text-slate-500" />
              <p className="text-sm text-slate-600">Loading reports…</p>
            </CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <ShieldCheck className="size-10 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">All clear!</h2>
              <p className="max-w-sm text-sm text-slate-600">
                There are no pending reports right now. New reports will appear here automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const reportId = report.id || report._id;
              const blogLink = resolveBlogLink(report.blog);
              const reporterLink = report.reporter?.id ? RouteProfileView(report.reporter.id) : '#';
              const isProcessing = processingId === reportId;

              return (
                <Card key={reportId} className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="gap-2 sm:flex sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {report.blog?.title || 'Blog unavailable'}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Submitted {formatTimestamp(report.submittedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 pb-0 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Reported Blog</p>
                      <Link to={blogLink} className="group inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        <ExternalLink className="size-4 transition-transform group-hover:-translate-y-0.5" />
                        <span className="line-clamp-2">{report.blog?.title || 'Blog unavailable'}</span>
                      </Link>
                      {report.blog?.author && (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <UserIcon className="size-4 text-slate-400" />
                          <span className="font-medium text-slate-700">Author:</span>
                          <span>{displayName(report.blog.author)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Reporter</p>
                      <Link to={reporterLink} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600">
                        <UserIcon className="size-4 text-slate-400" />
                        <span>{displayName(report.reporter)}</span>
                      </Link>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <div className="flex items-center gap-2 font-semibold">
                          <AlertCircle className="size-4" />
                          {report.type || 'General'}
                        </div>
                        {report.reason && <p className="mt-1 text-amber-800">{report.reason}</p>}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="mt-6 flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleAction(reportId, 'safe')}
                      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                      Mark Safe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleAction(reportId, 'remove')}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      Remove Blog
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleAction(reportId, 'ban')}
                      className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    >
                      {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                      Ban Author
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
