import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";
import { BookOpen, Eye, Feather, Heart, MessageCircle, Sparkles, Tag, Users } from "lucide-react";
import { RouteBlog, RouteBlogDetails } from "@/helpers/RouteName";

const ProfileView = () => {
  const { userId } = useParams();

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/user/get-user/${userId}?t=${Date.now()}`,
    { 
      method: "get", 
      credentials: "include",
      cache: "no-cache"
    },
    [userId]
  );

  const {
    data: blogData,
    loading: blogsLoading,
    error: blogsError,
  } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/blog/author/${userId}`,
    { method: "get", credentials: "include" },
    [userId]
  );

  const {
    data: followStats,
    loading: statsLoading,
    error: statsError,
  } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/follow/stats/${userId}`,
    { method: "get", credentials: "include" },
    [userId]
  );

  const profile = userData?.user;
  const blogs = blogData?.blog || [];
  const followersCount = followStats?.followersCount || 0;
  const followingCount = followStats?.followingCount || 0;

  const { totalViews, categoryLabels } = useMemo(() => {
    const views = blogs.reduce((acc, item) => acc + (item.views || 0), 0);
    const labels = Array.from(
      new Set(
        blogs
          .flatMap((item) => {
            if (Array.isArray(item.categories)) {
              return item.categories
                .map((category) => category?.name)
                .filter(Boolean);
            }
            return item.category?.name ? [item.category.name] : [];
          })
          .filter(Boolean)
      )
    );
    return { totalViews: views, categoryLabels: labels };
  }, [blogs]);

  const formatNumber = (value) => {
    const numericValue = typeof value === "number" ? value : Number(value) || 0;
    return numericValue.toLocaleString();
  };

  const statCards = useMemo(
    () => [
      {
        title: "Connections",
        value: followersCount,
        helper: "people tuned in",
        accent: "from-white/40 via-white/15 to-white/0",
        tone: "text-slate-900",
        icon: Users,
      },
      {
        title: "Following",
        value: followingCount,
        helper: "voices they follow",
        accent: "from-purple-50 via-white to-white",
        tone: "text-purple-900",
        icon: Feather,
      },
      {
        title: "Stories",
        value: blogs.length,
        helper: "published pieces",
        accent: "from-indigo-50 via-white to-white",
        tone: "text-indigo-900",
        icon: BookOpen,
      },
      {
        title: "Total views",
        value: totalViews,
        helper: "lifetime reads",
        accent: "from-emerald-50 via-white to-white",
        tone: "text-emerald-900",
        icon: Eye,
      },
    ],
    [blogs.length, followersCount, followingCount, totalViews]
  );

  const heroStats = useMemo(
    () => [
      { label: "Followers", value: followersCount },
      { label: "Following", value: followingCount },
      { label: "Total views", value: totalViews },
    ],
    [followersCount, followingCount, totalViews]
  );

  const profileBio = profile?.bio?.trim() || "This storyteller hasn't shared a bio yet.";
  const topicPreview = categoryLabels.slice(0, 3);
  const storyLabel = blogs.length === 1 ? "story" : "stories";

  if (userLoading || blogsLoading || statsLoading) {
    return <Loading />;
  }

  if (userError || blogsError || statsError) {
    return (
      <div className="py-10 text-center text-red-500">
        Unable to load profile details right now.
      </div>
    );
  }

  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "User";

  if (!profile) {
    return (
      <div className="py-10 text-center text-gray-500">This profile is unavailable.</div>
    );
  }

  const getBlogPreview = (blog) => {
    const raw = blog?.description || blog?.blogContent || "";
    const text = raw
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "No preview available yet.";
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  };

  const getCategoryLabel = (blog) => {
    if (Array.isArray(blog?.categories) && blog.categories.length > 0) {
      return blog.categories[0]?.name;
    }
    if (blog?.category) return blog.category?.name;
    return "Uncategorized";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/30 to-white">
      <div className="max-w-6xl px-4 py-10 mx-auto space-y-10 sm:px-8 lg:px-12">
        <section className="relative overflow-hidden rounded-[32px] bg-linear-to-r from-[#6C5CE7] to-[#8F7CF1] px-6 py-8 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] sm:px-10">
          <div className="absolute inset-y-0 right-0 hidden w-64 rounded-full translate-x-1/4 bg-white/10 blur-3xl md:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative flex-shrink-0 mx-auto md:mx-0">
                <div className="absolute inset-0 translate-x-1 -translate-y-1 rounded-full bg-white/20 blur-xl" />
                <Avatar className="relative w-24 h-24 border-4 border-white shadow-2xl sm:h-28 sm:w-28">
                  <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                  <AvatarFallback>{profile.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-3 text-center md:text-left">
                <p className="inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.35em] text-white/70 md:justify-start">
                  <Sparkles className="w-4 h-4" /> Creator profile
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                    {profile.name}
                  </h1>
                  <span className="self-center rounded-full border border-white/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                    {roleLabel}
                  </span>
                </div>
                {profile.email && (
                  <p className="text-sm text-white/75 sm:text-base">{profile.email}</p>
                )}
                <p className="text-sm text-white/85 sm:text-base">{profileBio}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/80 md:justify-start">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="px-4 py-2 text-center border rounded-2xl border-white/30 bg-white/10">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/70">{stat.label}</p>
                      <p className="text-lg font-semibold">{formatNumber(stat.value)}</p>
                    </div>
                  ))}
                </div>
                {topicPreview.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/80 md:justify-start">
                    {topicPreview.map((topic) => (
                      <span key={topic} className="px-3 py-1 border rounded-full border-white/30 bg-white/10">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <div className="px-8 py-5 text-center border rounded-3xl border-white/30 bg-white/10">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Stories</p>
                <p className="text-3xl font-black text-white sm:text-4xl">{formatNumber(blogs.length)}</p>
                <p className="text-xs text-white/70">{storyLabel}</p>
              </div>
              <FollowButton
                userId={userId}
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#6C5CE7] shadow-[0_20px_60px_-45px_rgba(15,23,42,0.8)] transition hover:bg-white/90"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${card.accent} px-6 py-5 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.8)]`}
            >
              <div className="flex items-center gap-3">
                <card.icon className="h-10 w-10 text-[#6C5CE7]" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">{card.title}</p>
                  <p className={`text-3xl font-black ${card.tone}`}>{formatNumber(card.value)}</p>
                  <p className="text-sm text-slate-500">{card.helper}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {categoryLabels.length > 0 && (
          <section className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#6C5CE7]">
                <Tag className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Writing topics</p>
                <h2 className="text-xl font-semibold text-slate-900">Areas of focus</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {categoryLabels.map((label) => (
                <span
                  key={label}
                  className="px-4 py-2 text-sm font-medium border rounded-full border-slate-200 bg-slate-50 text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Published articles</p>
              <h2 className="text-2xl font-semibold text-slate-900">Latest work</h2>
            </div>
            <span className="px-4 py-2 text-sm font-medium border rounded-full border-slate-200 bg-slate-50 text-slate-600">
              {formatNumber(blogs.length)} {storyLabel}
            </span>
          </div>

          {blogs.length === 0 ? (
            <div className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-slate-50/80">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7]">
                <BookOpen className="w-10 h-10" />
              </div>
              <p className="text-lg font-semibold text-slate-800">No articles published yet</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for fresh writing from {profile.name}.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {blogs.map((blog) => {
                const primaryCategory = getCategoryLabel(blog);
                const blogDate = blog?.createdAt
                  ? new Date(blog.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";
                const likeCount = formatNumber(blog?.likeCount || 0);
                const viewCount = formatNumber(blog?.views || 0);
                const comments = formatNumber(
                  blog?.commentStats?.totalComments ||
                    blog?.commentsCount ||
                    blog?.commentCount ||
                    (Array.isArray(blog?.comments) ? blog.comments.length : 0)
                );
                const blogSlug = blog?.slug || blog?._id;
                const categorySlug = blog?.category?.slug || blog?.categories?.[0]?.slug;

                return (
                  <article
                    key={blog._id || blog.id}
                    className="flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white/95 p-4 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.8)] backdrop-blur-sm md:flex-row"
                  >
                    <div className="overflow-hidden rounded-2xl md:max-w-[220px] md:flex-shrink-0">
                      <img
                        src={blog?.featuredImage || "/placeholder.jpg"}
                        alt={blog?.title}
                        className="h-48 w-full object-cover transition duration-500 hover:scale-[1.02] md:h-full"
                      />
                    </div>
                    <div className="flex flex-col flex-1 gap-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] tracking-[0.3em] text-slate-600">
                          {primaryCategory}
                        </span>
                        {blogDate && <span className="text-[10px] text-slate-400">{blogDate}</span>}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                        {blog?.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-500 line-clamp-3">
                        {getBlogPreview(blog)}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-4 w-4 text-[#6C5CE7]" />
                          {viewCount} views
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-4 w-4 text-[#6C5CE7]" />
                          {likeCount} likes
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-4 w-4 text-[#6C5CE7]" />
                          {comments} comments
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                          to={
                            categorySlug && blogSlug
                              ? RouteBlogDetails(categorySlug, blogSlug)
                              : RouteBlog
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-[#6C5CE7] px-5 py-2 text-sm font-semibold text-white shadow-[0_15px_40px_-25px_rgba(108,92,231,0.9)] transition hover:bg-[#5b4bc4]"
                        >
                          Read article
                        </Link>
                        <Link
                          to={
                            categorySlug && blogSlug
                              ? RouteBlogDetails(categorySlug, blogSlug)
                              : RouteBlog
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfileView;
