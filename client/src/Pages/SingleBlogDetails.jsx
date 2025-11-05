import React, { useEffect, useState, useRef } from "react";
import Loading from "@/components/Loading";
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
import { RouteProfileView, RouteSignIn } from "@/helpers/RouteName";
import SaveButton from "@/components/SaveButton";

const SingleBlogDetails = () => {
  const { blog } = useParams();
  const [searchParams] = useSearchParams();
  const [showComments, setShowComments] = useState(false);
  const commentsRef = useRef(null);
  const summaryRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryTrigger, setSummaryTrigger] = useState(0);

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

  useEffect(() => {
    if (!b?._id) {
      setSummary("");
      setSummaryError("");
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError("");
        setSummary("");

        const query = summaryTrigger > 0 ? "?refresh=true" : "";
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

        if (isActive) {
          setSummary(result?.summary || "");
        }
      } catch (error) {
        if (!isActive || error.name === "AbortError") return;
        setSummary("");
        setSummaryError(error.message || "Failed to generate summary");
      } finally {
        if (isActive) {
          setSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [b?._id, summaryTrigger]);

  const summaryRequested = searchParams.get('summary') === 'true'

  useEffect(() => {
    if (summaryRequested && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [summaryRequested, summary]);

  if (loading) return <Loading />;

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

      {/* AI Summary */}
      <section
        ref={summaryRef}
        className="mt-10 p-6 bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 border border-blue-100 rounded-2xl shadow-sm"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-900">AI Summary</h2>
            <p className="text-sm text-blue-700/70">Powered by Gemini to help you skim the highlights.</p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryTrigger((prev) => prev + 1)}
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
                      <p key={`summary-paragraph-${index}`}>{paragraph}</p>
                    ))}
                    {bullets.length > 0 && (
                      <ul className="space-y-1 list-disc list-inside text-slate-700">
                        {bullets.map((bullet, index) => (
                          <li key={`summary-bullet-${index}`}>
                            {bullet.replace(/^-/,'').trim()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Summary will appear here once generated.</p>
          )}
        </div>
      </section>

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
        <button className="flex items-center gap-1 text-sm hover:text-black transition">
          <Share2 className="h-5 w-5" /> Share
        </button>
        <SaveButton blogId={b._id} withLabel className="text-sm" />
      </div>

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
