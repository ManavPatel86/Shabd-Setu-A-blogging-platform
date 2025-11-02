import React from "react";
import { MessageCircle, Share2, Bot, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { RouteBlogDetails } from "@/helpers/RouteName";
import LikeCount from "./LikeCount";
import ViewCount from "./ViewCount";

const BlogCard = ({ blog }) => {
  // ✅ Defensive check to prevent crash if blog is undefined
  if (!blog) return null;

  const {
    _id,
    featuredImage,
    title,
    description,
    author,
    category,
    createdAt,
    slug
  } = blog;

  const navigate = useNavigate();

  const handleOpen = () => {
    navigate(RouteBlogDetails(category?.slug, slug || _id));
  };

  return (
    <div
      onClick={handleOpen}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer flex flex-col p-5"
    >
      {/* Top Category */}
      <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium w-fit mb-3">
        {category?.name || "Uncategorized"}
      </span>

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
          <div className="flex items-center gap-3">
            <img
              src={author?.avatar || "/default-avatar.png"}
              alt={author?.name || "Author"}
              className="w-9 h-9 rounded-full border"
            />
            <div>
              <p className="font-medium text-sm">{author?.name || "Anonymous"}</p>
              <p className="text-xs text-gray-500">
                {createdAt
                  ? moment(createdAt).format("MMM D, YYYY")
                  : "Unknown date"}{" "}
                · <span className="text-green-500 font-semibold"><ViewCount blogId={_id} /></span>
              </p>
            </div>
          </div>
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

      {/* Bottom actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <button className="flex items-center gap-1 text-gray-600 hover:text-black text-sm">
          <Bot className="h-4 w-4" /> Summary
        </button>
        <div className="flex items-center gap-4 text-gray-500" onClick={(e) => e.stopPropagation()}>
          <LikeCount props={{ blogid: _id }} />
          <MessageCircle className="h-4 w-4 hover:text-black" />
          <Share2 className="h-4 w-4 hover:text-black" />
          <Bookmark className="h-4 w-4 hover:text-black" />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
