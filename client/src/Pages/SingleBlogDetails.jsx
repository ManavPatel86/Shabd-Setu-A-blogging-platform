import React, { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import { decode } from "entities";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Share2, Bookmark, Eye } from "lucide-react";
import LikeCount from "@/components/LikeCount";
import Comments from "@/components/Comments";
import ViewCount from "@/components/ViewCount";
import FollowButton from "@/components/FollowButton";
import { useSelector } from "react-redux";
import { RouteProfileView, RouteSignIn } from "@/helpers/RouteName";

const SingleBlogDetails = () => {
  const { blog } = useParams();
  const [showComments, setShowComments] = useState(false);
  const isLoggedIn = useSelector((state) => state.user?.isLoggedIn);
  const navigate = useNavigate();

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

  if (loading) return <Loading />;

  const b = data?.blog;
  const handleAuthorProfile = () => {
    if (b?.author?._id) {
      navigate(RouteProfileView(b.author._id));
    }
  };
  if (!b) return <div className="text-center py-10 text-gray-500">Blog not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-0 py-12 animate-fadeIn">
      
      {/* Tag */}
      <span className="px-4 py-1 text-sm font-medium rounded-full bg-gradient-to-r from-blue-100 via-blue-50 to-purple-100 text-blue-700 border border-blue-200 shadow-sm">
        {b?.category?.name}
      </span>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mt-5 leading-tight font-serif">
        {b.title}
      </h1>

      {/* Subtitle tone */}
      <p className="text-gray-600 text-lg mt-3 italic">
        a thoughtful read on {b?.category?.name?.toLowerCase()}
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

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-10"></div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 text-gray-600">
        <LikeCount props={{ blogid: b._id }} />
        <div className="flex items-center gap-1 text-sm">
          <Eye className="h-5 w-5" />
          <ViewCount blogId={b._id} addView={true} />
        </div>
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="flex items-center gap-1 text-sm hover:text-black transition">
          <MessageCircle className="h-5 w-5" /> Comment
        </button>
        <button className="flex items-center gap-1 text-sm hover:text-black transition">
          <Share2 className="h-5 w-5" /> Share
        </button>
        <button className="flex items-center gap-1 text-sm hover:text-black transition">
          <Bookmark className="h-5 w-5" /> Save
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-10 border-t pt-6">
          <Comments props={{ blogid: b._id }} />
        </div>
      )}
    </div>
  );
};

export default SingleBlogDetails;
