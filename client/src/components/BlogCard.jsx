import React, { useState, useRef } from "react";
import { MessageCircle, Share2, Bot, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { RouteBlogDetails, RouteProfileView } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";
import LikeCount from "./LikeCount";
import ViewCount from "./ViewCount";
import SaveButton from "./SaveButton";
import { getEnv } from "@/helpers/getEnv";
import SummaryModal from "./SummaryModal";
import { decode } from "entities";

const BlogCard = ({ blog, className = "" }) => {
  const navigate = useNavigate();

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

  const categories = Array.isArray(categoriesFromApi)
    ? categoriesFromApi.filter(Boolean)
    : category
    ? [category]
    : [];

  const primaryCategory = categories[0];

  const commentCount =
    typeof blog?.commentStats?.totalComments === "number"
      ? blog.commentStats.totalComments
      : typeof blog?.commentsCount === "number"
      ? blog.commentsCount
      : typeof blog?.commentCount === "number"
      ? blog.commentCount
      : Array.isArray(blog?.comments)
      ? blog.comments.length
      : 0;

  const formatCount = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0";
    if (value >= 1000000)
      return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    if (value >= 1000)
      return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
    return `${value}`;
  };

  const formattedCommentCount = formatCount(commentCount);

  const navigateToBlog = (showComments = false) => {
    const catSlug = primaryCategory?.slug || "category";
    navigate(
      RouteBlogDetails(catSlug, slug || _id) +
        (showComments ? "?comments=true" : "")
    );
  };

  // ------------------------------ SUMMARY HANDLER ------------------------------
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

  // ------------------------------ SHARE HANDLER ------------------------------
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${RouteBlogDetails(
      category?.slug,
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

  // ------------------------------ EXCERPT HANDLER ------------------------------
  const getBlogExcerpt = (html) => {
    if (!html) return "No preview available.";

    try {
      let decoded = decode(html);

      decoded = decoded.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
      decoded = decoded.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

      const blocks = decoded
        .split(/<\/?[^>]+>/g)
        .map((t) => t.replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0);

      if (!blocks.length) return "No preview available.";

      const best = blocks.find((b) => b.length > 40);
      const clean = (best || blocks[0]).trim();

      return clean.length > 150 ? clean.slice(0, 147) + "..." : clean;
    } catch {
      return "No preview available.";
    }
  };

  // ------------------------------ RENDER ------------------------------
  return (
    <>
      <div
        onClick={(e) => {
          if (!e.target.closest(".blog-actions")) navigateToBlog(false);
        }}
        className={`
          bg-white rounded-3xl p-5 
          border border-gray-100
          shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)]
          hover:-translate-y-1 hover:shadow-xl
          transition-all duration-300 cursor-pointer
          mb-6 flex flex-col
          ${className}
        `}
      >
        {/* IMAGE */}
        <div className="relative h-52 w-full rounded-3xl overflow-hidden mb-4 group">
          <img
            src={featuredImage || "/placeholder.jpg"}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />

          <div className="absolute top-4 right-4 flex gap-2 flex-wrap">
            {(categories.length > 0 ? categories.slice(0, 2) : ["Uncategorized"]).map(
              (item, index) => {
                const label = item?.name || item;
                const key =
                  item?._id || item?.slug || item?.name || `cat-${_id}-${index}`;

                return (
                  <span
                    key={key}
                    className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-gray-800 shadow-sm tracking-wide"
                  >
                    {label}
                  </span>
                );
              }
            )}
          </div>
        </div>

        {/* AUTHOR + DATE */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (author?._id) navigate(RouteProfileView(author._id));
            }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <img
              src={author?.avatar || "/default-avatar.png"}
              className="w-11 h-11 rounded-full border shadow-sm object-cover"
            />

            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">
                {author?.name || "Unknown Author"}
              </h4>

              <span className="text-xs text-gray-400">
                <ViewCount blogId={_id} />
              </span>
            </div>
          </div>

          <span className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-semibold">
            <Clock size={12} /> {moment(createdAt).format("MMM D, YYYY")}
          </span>
        </div>

        {/* TITLE (max 3 lines) */}
        <h2
          className="
            text-xl font-bold text-gray-900 leading-snug 
            hover:text-[#6C5CE7] transition-colors 
            line-clamp-3 mb-2
          "
        >
          {title}
        </h2>

        {/* DESCRIPTION (max 2 lines) */}
        <p className="text-gray-500 text-[14px] leading-relaxed line-clamp-2 mb-4">
          {getBlogExcerpt(blog?.blogContent)}
        </p>

        {/* ACTION BUTTONS */}
        <div className="mt-auto pt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateToBlog(false);
              }}
              className="
                bg-[#6C5CE7] text-white 
                px-5 py-2.5 rounded-2xl text-sm font-semibold 
                flex items-center gap-2 shadow-md shadow-indigo-200
                hover:bg-[#5b4bc4] hover:shadow-lg transition-all
              "
            >
              Read Article
              <ChevronRight size={16} className="opacity-80" />
            </button>

            <button
              onClick={openSummary}
              className="
                bg-white border border-gray-200 
                px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 
                flex items-center gap-2 
                hover:border-[#6C5CE7] hover:text-[#6C5CE7] 
                shadow-sm transition-colors
              "
            >
              <Bot className="h-4 w-4" />
              Smart Summary
            </button>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div
            className="
              blog-actions rounded-2xl 
              bg-white/90 border border-gray-100 
              px-4 py-3 
              flex items-center justify-between gap-3 
              text-sm text-gray-600 shadow-sm
            "
          >
            <div className="flex items-center gap-3">
              <LikeCount blogid={_id} variant="clean" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToBlog(true);
                }}
                className="
                  inline-flex items-center gap-2 
                  px-4 py-2 rounded-2xl 
                  bg-white/80 text-sm font-medium text-gray-700 
                  hover:bg-gray-50 transition-all
                "
              >
                <MessageCircle className="h-4 w-4 text-gray-600" />
                <span>{formattedCommentCount}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="
                  inline-flex items-center gap-2 
                  px-4 py-2 rounded-2xl 
                  text-sm font-semibold text-white 
                  bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6]
                  shadow-md shadow-indigo-200 hover:shadow-lg 
                  hover:scale-[1.02] transition-all
                "
              >
                <Share2 size={16} />
                Share
              </button>

              <SaveButton
                blogId={_id}
                size="sm"
                withLabel
                className="
                  rounded-2xl border border-gray-200 
                  bg-white px-4 py-2 text-sm font-medium text-gray-700 
                  hover:border-[#6C5CE7] hover:text-[#6C5CE7] 
                  transition-all
                "
              />
            </div>
          </div>
        </div>
      </div>

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
