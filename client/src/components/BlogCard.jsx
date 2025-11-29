import React, { useState, useRef } from "react";
import {
  MessageCircle,
  Share2,
  Bot,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  RouteBlogDetails,
  RouteProfileView,
} from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";
import LikeCount from "./LikeCount";
import ViewCount from "./ViewCount";
import SaveButton from "./SaveButton";
import { getEnv } from "@/helpers/getEnv";
import SummaryModal from "./SummaryModal";
import { decode } from "entities";

const BlogCard = ({ blog, className = "" }) => {
  const navigate = useNavigate();

  // -------- Summary states (from MAIN version) --------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [summary, setSummary] = useState("");
  const [cachedSummary, setCachedSummary] = useState("");
  const abortControllerRef = useRef(null);

  if (!blog) return null;

  const {
    _id,
    featuredImage,
    title,
    description,
    author,
    categories: categoriesFromApi,
    category,
    createdAt,
    slug,
  } = blog;

  // Backend-correct category logic (from MAIN)
  const categories = Array.isArray(categoriesFromApi)
    ? categoriesFromApi.filter(Boolean)
    : category
    ? [category]
    : [];

  const primaryCategory = categories[0];
  const hasExtraCategories = categories.length > 1;
  const primaryCategoryName = primaryCategory?.name || 'Uncategorized';
  const displayCategoryLabel = hasExtraCategories
    ? `${primaryCategoryName}…`
    : primaryCategoryName;

  // -------- Comment Count (UI branch logic) --------
  const commentCount =
    blog?.commentStats?.totalComments ??
    blog?.commentsCount ??
    blog?.commentCount ??
    (Array.isArray(blog?.comments) ? blog.comments.length : 0);

  const cleanDescription = (() => {
    if (!description) return "";
    try {
      return decode(description)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch {
      return description;
    }
  })();

  const formatCount = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0";
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
    }
    return String(value);
  };

  const formattedCommentCount = formatCount(commentCount);

  // -------- Navigation logic (MAIN) --------
  const navigateToBlog = (showComments = false) => {
    const catSlug = primaryCategory?.slug || "category";
    navigate(
      RouteBlogDetails(catSlug, slug || _id) +
        (showComments ? "?comments=true" : "")
    );
  };

  // -------- SUMMARY HANDLER (MAIN version – most stable) --------
  const fetchSummary = async (refresh = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setSummaryLoading(true);
      setSummaryError("");

      const query = refresh ? "?refresh=true" : "";
      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/blog/summary/${_id}${query}`,
        { method: "get", credentials: "include", signal: controller.signal }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok)
        throw new Error(result?.message || "Failed to generate summary");

      const text = result?.summary || "";

      if (result?.cached || !refresh) {
        setCachedSummary(text);
        setSummary(text);
      } else {
        setSummary(text || cachedSummary);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setSummary(cachedSummary || "");
        setSummaryError(err.message || "Failed to generate summary");
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const openSummary = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
    if (!cachedSummary && !summaryLoading) fetchSummary(false);
    else setSummary(cachedSummary);
  };

  const closeModal = () => setIsModalOpen(false);

  // -------- SHARE HANDLER (MAIN/UI same) --------
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${RouteBlogDetails(
      primaryCategory?.slug,
      slug || _id
    )}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description?.replace(/<[^>]*>/g, "").slice(0, 120),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("success", "Link copied to clipboard");
      }
    } catch {
      await navigator.clipboard.writeText(url);
      showToast("success", "Link copied to clipboard");
    }
  };

  // -------- EXCERPT (MAIN version is more accurate) --------
  const getBlogExcerpt = (html) => {
    if (!html) return "No preview available.";
    try {
      let decodedHTML = decode(html)
        .replace(/<script[\s\S]?>[\s\S]?<\/script>/gi, "")
        .replace(/<style[\s\S]?>[\s\S]?<\/style>/gi, "");

      const blocks = decodedHTML
        .split(/<\/?[^>]+>/g)
        .map((txt) => txt.replace(/\s+/g, " ").trim())
        .filter((txt) => txt.length > 0);

      if (!blocks.length) return "No preview available.";

      const best = blocks.find(
        (b) =>
          b.length > 40 &&
          !b.startsWith("{") &&
          !b.startsWith("[") &&
          !b.match(/^#/) &&
          !b.match(/^h\d/i)
      );

      const finalText = best || blocks[0];
      const clean = finalText.replace(/\s+/g, " ").trim();
      return clean.length > 150 ? clean.slice(0, 147) + "..." : clean;
    } catch {
      return "No preview available.";
    }
  };

  // -------- UI Rendering (UI version layout) --------
  return (
    <>
      <div
        onClick={(e) => {
          if (!e.target.closest(".blog-actions")) navigateToBlog(false);
        }}
        className={`
          flex h-full flex-col
          rounded-[26px] border border-slate-100 bg-white/95
          p-4 sm:p-5 shadow-[0_20px_48px_-32px_rgba(15,23,42,0.45)] backdrop-blur-sm
          transition-all duration-300 cursor-pointer
          hover:-translate-y-1 hover:shadow-xl
          ${className}
        `}
      >
        {/* IMAGE */}
        <div className="group relative mb-3 w-full overflow-hidden rounded-[20px]">
          <img
            src={featuredImage || "/placeholder.jpg"}
            alt={title}
            className="object-cover w-full h-48 transition-transform duration-700 sm:h-44 md:h-40 group-hover:scale-110"
          />

          {/* Category Badges */}
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-700 shadow-sm">
              {displayCategoryLabel}
            </span>
          </div>
        </div>

        {/* AUTHOR + DATE */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (author?._id) navigate(RouteProfileView(author._id));
            }}
            className="flex items-center gap-3"
          >
            <img
              src={author?.avatar || "/default-avatar.png"}
              className="object-cover w-10 h-10 border rounded-full shadow-sm border-slate-100"
              alt={author?.name || "Author avatar"}
            />

            <div className="text-left">
              <h4 className="text-sm font-semibold text-slate-900">
                {author?.name || "Unknown Author"}
              </h4>
              <span className="text-xs text-slate-400">
                <ViewCount blogId={_id} />
              </span>
            </div>
          </button>

          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-slate-50 text-slate-600">
            <Clock size={12} /> {moment(createdAt).format("MMM D, YYYY")}
          </span>
        </div>

        {/* TITLE */}
        <h2
          className="mb-1 text-[1.02rem] font-semibold leading-snug text-slate-900 transition-colors hover:text-[#6C5CE7] line-clamp-2"
        >
          {title}
        </h2>

        {/* EXCERPT */}
        <p className="mb-3 text-[13px] leading-relaxed text-slate-500 line-clamp-3">
          {cleanDescription || "No description available."}
        </p>

        {/* ACTION BUTTONS */}
        <div className="pt-2 mt-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToBlog(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#6C5CE7] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_10px_26px_-18px_rgba(108,92,231,0.9)] transition hover:bg-[#5b4bc4] hover:shadow-lg"
            >
              Read Article
              <ChevronRight size={16} className="opacity-80" />
            </button>

            <button
              onClick={openSummary}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
            >
              <Bot className="h-3.5 w-3.5" />
              Smart Summary
            </button>
          </div>

          {/* ACTION BAR */}
          <div
            className="
              blog-actions flex w-full flex-wrap items-center gap-2
              rounded-[20px] border border-slate-100 bg-white px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 shadow-sm
            "
          >
            <LikeCount
              blogid={_id}
              variant="chip"
              className="text-xs transition"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToBlog(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{formattedCommentCount}</span>
            </button>

            <button
              onClick={handleShare}
              aria-label="Share blog"
              className="inline-flex items-center justify-center rounded-full bg-[#6C5CE7]/12 p-2 text-[#6C5CE7] transition hover:bg-[#6C5CE7]/20"
            >
              <Share2 size={14} />
            </button>

            <SaveButton
              blogId={_id}
              size="sm"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 transition hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
            />
          </div>
        </div>
      </div>

      {/* SUMMARY MODAL */}
      <SummaryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError}
        onRefresh={() => fetchSummary(true)}
      />
    </>
  );
};

export default BlogCard;