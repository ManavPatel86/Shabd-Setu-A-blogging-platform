import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Share2, Bot, Loader2, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { RouteBlogDetails, RouteProfileView } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";
import LikeCount from "./LikeCount";
import ViewCount from "./ViewCount";
import SaveButton from "./SaveButton";
import { getEnv } from "@/helpers/getEnv";
import ReportModal from './ReportModal';
import { useSelector } from 'react-redux';

const BlogCard = ({ blog }) => {
  // Defensive check to prevent crash if blog is undefined
  if (!blog) return null;

  const {
    _id,
    featuredImage,
    title,
    description,
    author,
  categories: categoriesFromApi,
  category, // legacy fallback
    createdAt,
    slug
  } = blog;

  const navigate = useNavigate();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summary, setSummary] = useState("");
  const [cachedSummary, setCachedSummary] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const abortControllerRef = useRef(null);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const categories = Array.isArray(categoriesFromApi)
    ? categoriesFromApi.filter(Boolean)
    : category
      ? [category]
      : [];

  const primaryCategory = categories[0];

  const navigateToBlog = (showComments = false) => {
    const categorySlug = primaryCategory?.slug || 'category';
    navigate(
      RouteBlogDetails(categorySlug, slug || _id) +
        (showComments ? '?comments=true' : '')
    );
  };

  const handleCardClick = (e) => {
    // If the click is coming from the actions bar, don't navigate
    if (e.target.closest('.blog-actions')) {
      return;
    }
    navigateToBlog(false);
  };

  const handleAuthorClick = (event) => {
    event.stopPropagation();
    if (author?._id) {
      navigate(RouteProfileView(author._id));
    }
  };

  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const path = RouteBlogDetails(category?.slug, slug || _id);
    const url = `${window.location.origin}${path}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "Read this blog",
          text: description ? description.replace(/<[^>]*>/g, '').slice(0, 120) : undefined,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast('success', 'Link copied to clipboard');
      }
    } catch (err) {
      // If user cancels native share, do nothing; otherwise fallback to copy
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          showToast('success', 'Link copied to clipboard');
        } catch (_) {
          showToast('error', 'Unable to share.');
        }
      }
    }
  };

  const fetchSummary = async (refresh = false) => {
    if (!_id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setSummaryLoading(true);
      setSummaryError("");
      if (refresh && !cachedSummary) {
        setSummary("");
      }

      const query = refresh ? "?refresh=true" : "";
      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/blog/summary/${_id}${query}`,
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

      const incomingSummary = result?.summary || "";

      if (result?.cached || !refresh) {
        setCachedSummary(incomingSummary);
        setSummary(incomingSummary);
      } else {
        setSummary(incomingSummary || cachedSummary);
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      setSummary(cachedSummary || "");
      setSummaryError(error.message || "Failed to generate summary");
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setSummaryLoading(false);
    }
  };

  const handleSummaryToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const nextState = !isSummaryOpen;
    setIsSummaryOpen(nextState);

    if (nextState) {
      if (cachedSummary) {
        setSummary(cachedSummary);
        setSummaryError("");
      } else if (!summary && !summaryLoading) {
        fetchSummary(false);
      }
    }
  };

  const handleSummaryRefresh = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (cachedSummary) {
      setSummary(cachedSummary);
      setSummaryError("");
    }
    fetchSummary(true);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer flex flex-col p-5"
    >
      {/* Top Categories */}
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.length > 0 ? (
          categories.map((item) => (
            <span
              key={item?._id || item?.slug || item?.name}
              className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium"
            >
              {item?.name || "Uncategorized"}
            </span>
          ))
        ) : (
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
            Uncategorized
          </span>
        )}
      </div>

      {/* Main Row */}
      <div className="flex flex-col md:flex-row justify-between gap-5">
        {/* Content */}
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold leading-snug mb-2">
            {title || "Untitled Blog"}
          </h2>

          <p
            className="text-gray-600 text-sm md:text-base line-clamp-2 mb-4"
            dangerouslySetInnerHTML={{
              __html: description
                ? description.slice(0, 180) + "..."
                : "No description available."
            }}
          ></p>

          {/* Author */}
          <button
            type="button"
            onClick={handleAuthorClick}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <img
              src={author?.avatar || "/default-avatar.png"}
              alt={author?.name || "Author"}
              className="w-9 h-9 rounded-full border"
            />
            <div>
              <p className="font-medium text-sm text-gray-900">
                {author?.name || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500">
                {createdAt
                  ? moment(createdAt).format("MMM D, YYYY")
                  : "Unknown date"}{" "}
                · <span className="text-green-500 font-semibold"><ViewCount blogId={_id} /></span>
              </p>
            </div>
          </button>
        </div>

        {/* Image */}
        <div className="w-full md:w-48 h-32 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={featuredImage || "/placeholder.jpg"}
            alt={title || "Blog Image"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {isSummaryOpen ? (
        <div className="mt-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">AI Summary</p>
              <button
                type="button"
                onClick={handleSummaryRefresh}
                className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 disabled:opacity-60"
                disabled={summaryLoading}
              >
                {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {summaryLoading ? "Refreshing" : "Refresh"}
              </button>
            </div>

            <div className="mt-3 text-xs leading-relaxed text-slate-700">
              {summaryLoading && !summary ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating summary...
                </div>
              ) : summaryError ? (
                <p className="text-red-600">{summaryError}</p>
              ) : summary ? (
                <div className="space-y-3">
                  {(() => {
                    const lines = summary
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    const paragraphs = lines.filter((line) => !line.startsWith("-"));
                    const bullets = lines.filter((line) => line.startsWith("-"));
                    return (
                      <>
                        {paragraphs.map((paragraph, index) => (
                          <p key={`card-summary-paragraph-${index}`}>{paragraph}</p>
                        ))}
                        {bullets.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-slate-600">
                            {bullets.map((bullet, index) => (
                              <li key={`card-summary-bullet-${index}`}>
                                {bullet.replace(/^[-*]\s?/, "").trim()}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-slate-500">Summary will appear here once generated.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Bottom actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSummaryToggle}
          className="flex items-center gap-1 text-gray-600 hover:text-black text-sm"
        >
          <Bot className="h-4 w-4" /> {isSummaryOpen ? "Hide" : "Summary"}
        </button>
        <div className="blog-actions flex items-center gap-4 text-gray-500">
          <LikeCount blogid={_id} />
          <button onClick={(e) => {
            e.preventDefault();
            navigateToBlog(true);
          }} className="flex items-center gap-1 text-gray-600 hover:text-black">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 text-gray-600 hover:text-black cursor-pointer">
            <Share2 className="h-4 w-4" />
          </button>
          <SaveButton blogId={_id} size="sm" className="text-gray-600" />
          {user && user.isLoggedIn && (
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setReportOpen(true);
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold cursor-pointer transition-colors"
              title="Report this blog"
            >
              <Flag className="h-4 w-4" /> Report
            </button>
          )}
        </div>
      </div>
      <ReportModal blogId={_id} open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
};

export default BlogCard;
