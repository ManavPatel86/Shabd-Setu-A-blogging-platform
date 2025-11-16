import React, { useEffect, useState, useRef, useCallback } from "react";
import Loading from "@/components/Loading";
import RelatedBlog from '@/components/RelatedBlog'
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import { decode } from "entities";
import moment from "moment";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { MessageCircle, Share2, Eye, Loader2 } from "lucide-react";
import LikeCount from "@/components/LikeCount";
import Comments from "@/components/Comments";
import ViewCount from "@/components/ViewCount";
import FollowButton from "@/components/FollowButton";
import { useSelector } from "react-redux";
import { RouteBlogDetails, RouteProfileView, RouteSignIn } from "@/helpers/RouteName";
import { getDisplayName } from '@/utils/functions';
import SaveButton from "@/components/SaveButton";
import ReportModal from '@/components/ReportModal';
import { Flag } from 'lucide-react';
import { showToast } from "@/helpers/showToast";

const SingleBlogDetails = () => {
  const { blog } = useParams();
  const [searchParams] = useSearchParams();
  const [showComments, setShowComments] = useState(false);
  const commentsRef = useRef(null);
  const summaryRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const summaryAbortRef = useRef(null);

  useEffect(() => {
    if (searchParams.get('comments') === 'true') {
      setShowComments(true);
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [searchParams]);
  const isLoggedIn = useSelector((state) => state.user?.isLoggedIn);
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);

  const [showSidebar, setShowSidebar] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(RouteSignIn, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const { data, loading } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/blog/get-blog/${blog}`,
    { method: "get", credentials: "include" },
    [blog]
  );

  const b = data?.blog;
  const categories = Array.isArray(b?.categories)
    ? b.categories.filter(Boolean)
    : b?.category
      ? [b.category]
      : [];
  const categoryNames = categories
    .map((category) => category?.name)
    .filter(Boolean);
  const subtitleCategory = categoryNames.length
    ? categoryNames.join(", ")
    : "this topic";

  const fetchSummary = useCallback(
    async (refresh = false) => {
      if (!b?._id) return;

      if (summaryAbortRef.current) {
        summaryAbortRef.current.abort();
      }

      const controller = new AbortController();
      summaryAbortRef.current = controller;

      try {
        setSummaryLoading(true);
        setSummaryError("");
        if (refresh) {
          setSummary("");
        }

        const query = refresh ? "?refresh=true" : "";
        const response = await fetch(
          `${getEnv("VITE_API_BASE_URL")}/blog/summary/${b._id}${query}`,
          {
            method: "get",
            credentials: "include",
            signal: controller.signal,
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.message || "Failed to generate summary");
        }

        setSummary(result?.summary || "");
      } catch (error) {
        if (error.name === "AbortError") return;
        setSummary("");
        setSummaryError(error.message || "Failed to generate summary");
      } finally {
        if (summaryAbortRef.current === controller) {
          summaryAbortRef.current = null;
        }
        setSummaryLoading(false);
      }
    },
    [b?._id]
  );

  useEffect(() => {
    return () => {
      if (summaryAbortRef.current) {
        summaryAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!showSummary) {
      return;
    }

    if (!summary && !summaryLoading) {
      fetchSummary(false);
    }
  }, [showSummary, summary, summaryLoading, fetchSummary]);

  const summaryRequested = searchParams.get('summary') === 'true'

  useEffect(() => {
    if (summaryAbortRef.current) {
      summaryAbortRef.current.abort();
      summaryAbortRef.current = null;
    }
    setSummary("");
    setSummaryError("");
    setSummaryLoading(false);
    setShowSummary(summaryRequested);
  }, [b?._id, summaryRequested]);

  useEffect(() => {
    if (summaryRequested && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [summaryRequested, summary]);

  const handleSummaryToggle = () => {
    const nextState = !showSummary;
    if (!nextState && summaryAbortRef.current) {
      summaryAbortRef.current.abort();
      summaryAbortRef.current = null;
      setSummaryLoading(false);
    }
    setShowSummary(nextState);
  };

  if (loading) return <Loading />;

  const handleAuthorProfile = () => {
    if (b?.author?._id) {
      navigate(RouteProfileView(b.author._id));
    }
  };
  if (!b) return <div className="text-center py-10 text-gray-500">Blog not found</div>;

  const handleShare = async () => {
    const path = RouteBlogDetails(b?.category?.slug, b?.slug || b?._id)
    const url = `${window.location.origin}${path}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: b?.title || 'Read this blog',
          text: decode(b?.blogContent || '').replace(/<[^>]*>/g, '').slice(0, 120) || undefined,
          url
        })
        return
      }
      await navigator.clipboard.writeText(url)
      showToast('success', 'Link copied to clipboard')
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url)
          showToast('success', 'Link copied to clipboard')
        } catch (_) {
          showToast('error', 'Unable to share.')
        }
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-0 py-12 animate-fadeIn">
      <div className="md:flex md:items-start md:gap-8">
        <div className={`md:flex-1 ${isExpanded ? 'md:max-w-full' : 'md:max-w-[66%]'}`}>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {categories.length > 0 ? (
          categories.map((categoryItem, index) => (
            <span
              key={categoryItem?._id || categoryItem?.slug || index}
              className="px-4 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-blue-100 via-blue-50 to-purple-100 text-blue-700 border border-blue-200 shadow-sm"
            >
              {categoryItem?.name || "Uncategorized"}
            </span>
          ))
        ) : (
          <span className="px-4 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">
            Uncategorized
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-5 leading-tight font-serif">
        {b.title}
      </h1>

      {/* Subtitle tone */}
      <p className="text-gray-600 text-lg mt-3 italic">
        a thoughtful read on {subtitleCategory.toLowerCase()}
      </p>

      {/* Author */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleAuthorProfile}
          className="flex items-center gap-3 text-left focus:outline-none hover:opacity-80 transition"
        >
          <Avatar className="h-12 w-12 border shadow-sm">
            <AvatarImage src={b?.author?.avatar} />
          </Avatar>
          <div>
            <p className="text-gray-900 font-medium">{b?.author?.name}</p>
            <p className="text-sm text-gray-500">
              {moment(b.createdAt).format("MMM D, YYYY")} • 5 min read
            </p>
          </div>
        </button>
        
        <FollowButton userId={b?.author?._id} className="px-4 py-2" />
      </div>

      {/* Image */}
      <div className="mt-10 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <img src={b.featuredImage} alt={b.title} className="w-full object-cover rounded-2xl" />
      </div>

      <div className="mt-8 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleSummaryToggle}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          {showSummary ? "Hide AI Summary" : "Generate AI Summary"}
        </button>

        {/* If sidebar is removed, show a small control to restore it */}
        {!showSidebar && (
          <div className="mt-4 md:mt-0 md:ml-1 flex justify-end">
            <button
              onClick={() => {
                setShowSidebar(true)
                setIsExpanded(false)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Show recommendations
            </button>
          </div>
        )}
      </div>

      {showSummary ? (
        <section
          ref={summaryRef}
          className="mt-6 p-6 bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 border border-blue-100 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">AI Summary</h2>
              <p className="text-sm text-blue-700/70">Powered by Gemini to help you skim the highlights.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchSummary(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 disabled:opacity-60"
              disabled={summaryLoading}
            >
              {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {summaryLoading ? "Updating" : "Refresh summary"}
            </button>
          </div>

          <div className="mt-4">
            {summaryLoading && !summary ? (
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating summary...
              </div>
            ) : summaryError ? (
              <p className="text-sm text-red-600">{summaryError}</p>
            ) : summary ? (
              <div className="space-y-4 text-sm leading-relaxed text-slate-800">
                {summary.split("\n").map((paragraph, index) => (
                  paragraph.trim() ? (
                    <p key={`summary-paragraph-${index}`}>{paragraph.trim()}</p>
                  ) : null
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Summary will appear here once generated.</p>
            )}
          </div>
        </section>
      ) : null}

      {/* Content */}
      <article
        className="
          prose prose-lg max-w-none text-gray-800 
          mt-12 leading-relaxed prose-headings:font-semibold
          prose-headings:tracking-tight prose-h2:mt-12 prose-h2:mb-4
          prose-h2:text-3xl prose-h2:font-serif
          prose-h3:mt-10 prose-h3:mb-3
          prose-h3:text-2xl prose-h3:font-serif
          prose-a:text-blue-600 hover:prose-a:text-blue-800
          prose-strong:text-gray-900 prose-blockquote:border-l-blue-400
          prose-blockquote:text-gray-600 prose-blockquote:bg-gray-50
          prose-blockquote:p-4 prose-blockquote:rounded-xl prose-img:rounded-xl
        "
        dangerouslySetInnerHTML={{ __html: decode(b.blogContent) }}
      />

        </div>

        {/* Sidebar: render only when shown */}
        {showSidebar && (
          <aside className="md:w-[32%] mt-8 md:mt-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Recommended for you</h3>
                <RelatedBlog
                  category={categories}
                  currentBlog={b?.slug || b?._id}
                  onClose={() => {
                    setShowSidebar(false)
                    setIsExpanded(true)
                  }}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
      {/* If sidebar is removed, show a small control to restore it */}
        {!showSidebar && (
          <div className="mt-4 md:mt-0 md:ml-1 flex justify-end">
            <button
              onClick={() => {
                setShowSidebar(true)
                setIsExpanded(false)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              Show recommendations
            </button>
          </div>
        )}

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-10"></div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 text-gray-600">
        <LikeCount blogid={b._id} />
        <div className="flex items-center gap-1 text-sm">
          <Eye className="h-5 w-5" />
          <ViewCount blogId={b._id} addView={true} />
        </div>
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="flex items-center gap-1 text-sm hover:text-black transition">
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
        <button onClick={handleShare} className="flex items-center gap-1 text-sm hover:text-black transition cursor-pointer">
          <Share2 className="h-5 w-5" /> Share
        </button>
        <SaveButton blogId={b._id} withLabel className="text-sm" />
        {isLoggedIn && (
          <button
            onClick={(e) => {
              e.preventDefault();
              setReportOpen(true);
            }}
            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold cursor-pointer transition-colors"
            title="Report this blog"
          >
            <Flag className="h-4 w-4" /> Report
          </button>
        )}
      </div>

      <ReportModal blogId={b._id} open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Comments Section */}
      {showComments && (
        <div ref={commentsRef} className="mt-10 border-t pt-6">
          <Comments blogid={b._id} />
        </div>
      )}
    </div>
  );
};

export default SingleBlogDetails;
