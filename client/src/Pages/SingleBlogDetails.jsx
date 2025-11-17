import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Loading from "@/components/Loading";
import RelatedBlog from "@/components/RelatedBlog";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import { decode } from "entities";
import moment from "moment";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { MessageCircle, Share2, Eye, Loader2, Calendar, Clock3, Sparkles, Trash2 } from "lucide-react";
import LikeCount from "@/components/LikeCount";
import ViewCount from "@/components/ViewCount";
import FollowButton from "@/components/FollowButton";
import { useSelector } from "react-redux";
import { RouteBlogDetails, RouteProfileView, RouteSignIn } from "@/helpers/RouteName";
import SaveButton from "@/components/SaveButton";
import { showToast } from "@/helpers/showToast";
import { Textarea } from "@/components/ui/textarea";
import userIcon from "@/assets/images/user.png";

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
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState(null);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);

  useEffect(() => {
    if (searchParams.get("comments") === "true") {
      setShowComments(true);
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [searchParams]);

  const userState = useSelector((state) => state.user);
  const isLoggedIn = userState?.isLoggedIn;
  const currentUser = userState?.user;
  const navigate = useNavigate();

  const [showSidebar, setShowSidebar] = useState(true);

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
  const categoryNames = categories.map((category) => category?.name).filter(Boolean);

  const commentsUrl = useMemo(
    () => (b?._id ? `${getEnv("VITE_API_BASE_URL")}/comment/get/${b._id}` : null),
    [b?._id]
  );

  const { data: commentsData, loading: commentsLoading } = useFetch(
    commentsUrl,
    { method: "get", credentials: "include" },
    [commentsUrl, commentsRefreshKey]
  );

  const comments = commentsData?.comments || [];

  const COMMENT_PILL_ICON_MAP = {
    art: "🎨",
    design: "🎨",
    travel: "✈️",
    technology: "💻",
    tech: "💻",
    business: "💼",
    finance: "💰",
    lifestyle: "🌿",
    health: "🏥",
    news: "🗞️",
    sports: "🏆",
  };

  const getCategoryEmoji = (label) => {
    if (!label) return "📝";
    const cleaned = label.toLowerCase();
    return COMMENT_PILL_ICON_MAP[cleaned] || label.match(/\p{Extended_Pictographic}/u)?.[0] || "📝";
  };

  const readingTimeEstimate = "5 min read";

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    const value = commentInput.trim();
    if (value.length < 3) {
      showToast("error", "Comment must be at least 3 characters long.");
      return;
    }
    if (!b?._id) return;

    try {
      setCommentSubmitting(true);
      const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/comment/add`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ blogid: b._id, comment: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Unable to add comment.");
      }
      setCommentInput("");
      setCommentsRefreshKey((prev) => prev + 1);
      window.dispatchEvent(new Event("refreshComments"));
      showToast("success", result?.message || "Comment added");
    } catch (error) {
      showToast("error", error.message || "Unable to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId || commentDeletingId) return;
    try {
      setCommentDeletingId(commentId);
      const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/comment/delete/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete comment");
      }
      setCommentsRefreshKey((prev) => prev + 1);
      window.dispatchEvent(new Event("refreshComments"));
      showToast("success", result?.message || "Comment deleted");
    } catch (error) {
      showToast("error", error.message || "Error deleting comment");
    } finally {
      setCommentDeletingId(null);
    }
  };

  const subtitleCategory = categoryNames.length ? categoryNames.join(", ") : "this topic";
  const statHighlights = [
    {
      label: "Reading time",
      value: readingTimeEstimate,
      accent: "⏱️",
    },
    {
      label: "Published",
      value: moment(b?.createdAt).format("MMM D, YYYY"),
      accent: "📅",
    },
    {
      label: "Category",
      value: subtitleCategory,
      accent: "🏷️",
    },
    {
      label: "Community",
      value: `${comments.length} comment${comments.length === 1 ? "" : "s"}`,
      accent: "💬",
    },
  ];

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

  const summaryRequested = searchParams.get("summary") === "true";

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
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const path = RouteBlogDetails(b?.category?.slug, b?.slug || b?._id);
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: b?.title || "Read this blog",
          text: decode(b?.blogContent || "").replace(/<[^>]*>/g, "").slice(0, 120) || undefined,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("success", "Link copied to clipboard");
    } catch (err) {
      if (err?.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          showToast("success", "Link copied to clipboard");
        } catch (_) {
          showToast("error", "Unable to share.");
        }
      }
    }
  };

  const handleCommentsToggle = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 pt-6 pb-16 text-gray-900">
      <div className={`grid grid-cols-1 ${showSidebar ? "xl:grid-cols-[2.1fr_0.9fr]" : ""} gap-8 items-start`}>
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-6 sm:px-10 py-10 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.9)]">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-purple-300/25 rounded-full blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {(categories.length ? categories : [{ name: "Uncategorized" }]).map((categoryItem, index) => {
                  const label = categoryItem?.name || "Uncategorized";
                  return (
                    <span
                      key={categoryItem?._id || categoryItem?.slug || index}
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-[0_25px_60px_-40px_rgba(255,255,255,0.9)] backdrop-blur whitespace-nowrap"
                    >
                      <span>{getCategoryEmoji(label)}</span>
                      {label}
                    </span>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h1 className="text-[2.75rem] sm:text-[44px] font-black leading-[1.15] tracking-tight">
                  {b.title}
                </h1>
                <p className="text-base sm:text-lg text-white/85 max-w-3xl">
                  A thoughtful read on {subtitleCategory.toLowerCase()} — curated for your ShabdSetu library.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-4 rounded-3xl border border-white/35 bg-white/15 px-5 py-4 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.8)]">
                  <button
                    type="button"
                    onClick={handleAuthorProfile}
                    className="flex items-center gap-4 text-left"
                  >
                    <Avatar className="h-14 w-14 border-2 border-white/80 shadow-lg">
                      <AvatarImage src={b?.author?.avatar} />
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold text-white">{b?.author?.name}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
                        <span>{b?.author?.role || "Creator"}</span>
                        <span className="inline-flex items-center gap-1 text-white/80">
                          <Calendar className="h-3.5 w-3.5" />
                          {moment(b.createdAt).format("MMM D, YYYY")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-white/80">
                          <Clock3 className="h-3.5 w-3.5" />
                          {readingTimeEstimate}
                        </span>
                      </div>
                    </div>
                  </button>
                  <FollowButton userId={b?.author?._id} className="rounded-2xl bg-white/90 text-[#6C5CE7] font-semibold px-5 py-2" />
                </div>
                <div className="rounded-3xl border border-white/25 bg-white/15 px-4 py-3 text-sm text-white/80 shadow-sm">
                  <p className="text-[11px] uppercase tracking-[0.35em]">Reading streak</p>
                  <p className="text-3xl font-black text-white">04</p>
                  <p className="text-xs text-white/80">days on ShabdSetu</p>
                </div>
              </div>
            </div>
          </section>
          <figure className="rounded-[32px] border border-white/80 bg-white/50 shadow-[0_35px_90px_-55px_rgba(15,23,42,0.85)] overflow-hidden">
            <img src={b.featuredImage} alt={b.title} className="w-full h-full object-cover" />
            <figcaption className="flex items-center justify-between gap-3 border-t border-white/60 bg-white/80 px-4 py-3 text-xs text-gray-600">
              Captured for this story
              <span className="rounded-full bg-gray-900/90 px-3 py-1 text-white text-[11px] uppercase tracking-[0.25em]">
                {subtitleCategory}
              </span>
            </figcaption>
          </figure>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSummaryToggle}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/60 hover:shadow-xl transition"
          >
            <Sparkles className="h-4 w-4" />
            {showSummary ? "Hide AI Summary" : "AI summary"}
          </button>
          <button
            type="button"
            onClick={handleCommentsToggle}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-[#6C5CE7]/40"
          >
            <MessageCircle className="h-4 w-4" />
            Jump to comments
          </button>
          {!showSidebar && (
            <button
              onClick={() => {
                setShowSidebar(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              Show recommendations
            </button>
          )}
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statHighlights.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-gray-100 bg-white/80 px-5 py-4 shadow-[0_20px_40px_-35px_rgba(15,23,42,0.8)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 flex items-center gap-2">
                <span>{stat.accent}</span>
                {stat.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-[#1c1836]">{stat.value}</p>
            </div>
          ))}
        </section>

        {showSummary && (
          <section
            ref={summaryRef}
            className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6 py-6 shadow-inner"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">AI Summary</h2>
                <p className="text-sm text-blue-600/80">Powered by Gemini to fast-track your reading.</p>
              </div>
              <button
                type="button"
                onClick={() => fetchSummary(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50"
                disabled={summaryLoading}
              >
                {summaryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {summaryLoading ? "Refreshing" : "Refresh summary"}
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed text-slate-800 space-y-4">
              {summaryLoading && !summary ? (
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating summary...
                </div>
              ) : summaryError ? (
                <p className="text-red-600">{summaryError}</p>
              ) : summary ? (
                summary.split("\n").map((paragraph, index) =>
                  paragraph.trim() ? (
                    <p key={`summary-${index}`}>{paragraph.trim()}</p>
                  ) : null
                )
              ) : (
                <p className="text-slate-500">Summary will appear here once generated.</p>
              )}
            </div>
          </section>
        )}

        <article
          className="prose prose-lg max-w-none leading-relaxed text-gray-800 rounded-[32px] border border-gray-100 bg-white/90 px-6 sm:px-10 py-10 shadow-[0_25px_65px_-45px_rgba(15,23,42,0.5)] prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-gray-900 prose-h2:text-3xl prose-h3:text-2xl prose-ul:list-none prose-ul:pl-0 prose-li:relative prose-li:pl-6"
          dangerouslySetInnerHTML={{ __html: decode(b.blogContent) }}
        />

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="rounded-3xl border border-gray-100 bg-white/95 px-4 py-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.8)] flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Appreciate</p>
            <LikeCount blogid={b._id} variant="pill" className="shadow-[0_10px_30px_-20px_rgba(108,92,231,0.6)]" />
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white/95 px-4 py-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.8)] flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Readers</p>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-600">
              <Eye className="h-4 w-4 text-gray-500" />
              <ViewCount blogId={b._id} addView={true} />
            </div>
          </div>
          <button
            onClick={handleCommentsToggle}
            className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white px-4 py-4 text-left shadow-[0_20px_55px_-45px_rgba(15,23,42,0.8)] flex flex-col gap-2 hover:border-[#6C5CE7]/40"
          >
            <span className="text-xs uppercase tracking-[0.35em] text-gray-400">Discuss</span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <MessageCircle className="h-4 w-4" />
              {showComments ? "Hide comments" : "Open comments"}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white px-4 py-4 text-left shadow-[0_20px_55px_-45px_rgba(15,23,42,0.8)] flex flex-col gap-2 hover:border-[#6C5CE7]/40"
          >
            <span className="text-xs uppercase tracking-[0.35em] text-gray-400">Share</span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Share2 className="h-4 w-4" />
              Copy or share link
            </span>
          </button>
          <div className="rounded-3xl border border-gray-100 bg-white/95 px-4 py-4 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.8)] flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Save</p>
            <SaveButton
              blogId={b._id}
              withLabel
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-[#6C5CE7]/40"
            />
          </div>
        </section>

        {showComments && (
          <section ref={commentsRef} className="space-y-6 rounded-[32px] border border-gray-100 bg-white/95 px-6 sm:px-10 py-8 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">Community</p>
                <h2 className="text-2xl font-bold text-[#1c1836]">Comments</h2>
              </div>
              <span className="rounded-full border border-gray-200 px-4 py-1 text-sm font-semibold text-gray-500">
                {comments.length} entries
              </span>
            </div>

            <div className="space-y-4">
              {commentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`comment-skel-${idx}`} className="h-20 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
                  ))}
                </div>
              ) : comments.length ? (
                comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white/90 px-4 py-4 shadow-[0_12px_30px_-30px_rgba(15,23,42,0.8)]"
                  >
                    <Avatar className="h-12 w-12 border border-purple-100 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 font-semibold">
                      <AvatarImage src={comment.user?.avatar || userIcon} />
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#1c1836]">{comment.user?.name || "Guest"}</p>
                          <p className="text-xs uppercase tracking-[0.35em] text-gray-400">
                            {moment(comment.createdAt).fromNow()}
                          </p>
                        </div>
                        {currentUser?._id === comment.user?._id && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="inline-flex items-center gap-1 rounded-2xl border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 disabled:opacity-50"
                            disabled={commentDeletingId === comment._id}
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{comment.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center text-gray-500">
                  No comments yet. Be the first to share your thoughts.
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <label className="text-sm font-semibold text-gray-700">Add a comment</label>
                <Textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Type your comment..."
                  className="min-h-[110px] rounded-3xl border border-gray-200 bg-white/90 px-5 py-4 text-sm text-gray-700 shadow-inner focus-visible:ring-2 focus-visible:ring-[#6C5CE7]/40"
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#6C5CE7] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-200/60 disabled:opacity-60"
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {commentSubmitting ? "Posting" : "Post comment"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500">Sign in to add a comment.</p>
            )}
          </section>
        )}
      </div>
      {showSidebar && (
        <aside className="w-full">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-4xl border border-gray-100 bg-white/95 px-5 py-6 shadow-[0_30px_70px_-55px_rgba(15,23,42,0.7)]">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">Discover</p>
                  <h3 className="text-xl font-semibold text-[#1c1836]">Recommended for you</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSidebar(false)}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 hover:border-gray-300"
                >
                  Hide
                </button>
              </div>
              <div className="pt-4">
                <RelatedBlog
                  category={categories}
                  currentBlog={b?.slug || b?._id}
                  hideCloseButton
                  onClose={() => setShowSidebar(false)}
                />
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  </div>
);
};

export default SingleBlogDetails;
