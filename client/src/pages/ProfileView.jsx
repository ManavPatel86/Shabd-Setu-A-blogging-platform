import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BlogCard from "@/components/BlogCard";
import FollowButton from "@/components/FollowButton";
import { BookOpen, Eye, Feather, Sparkles, Tag, Users } from "lucide-react";

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

  const profileBio = profile?.bio?.trim() || "This storyteller hasn't shared a bio yet.";
  const topicPreview = categoryLabels.slice(0, 3);
  const storyLabel = blogs.length === 1 ? "story" : "stories";

  if (userLoading || blogsLoading || statsLoading) {
    return <Loading />;
  }

  if (userError || blogsError || statsError) {
    return (
      <div className="text-center py-10 text-red-500">
        Unable to load profile details right now.
      </div>
    );
  }

  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "User";

  if (!profile) {
    return (
      <div className="text-center py-10 text-gray-500">This profile is unavailable.</div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50/30 to-white">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-8 lg:px-12">
        <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] px-6 py-10 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] sm:px-10">
          <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-64 w-64 translate-y-1/2 rounded-full bg-purple-300/40 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="absolute inset-0 -translate-y-2 translate-x-2 rounded-full bg-white/20 blur-2xl" />
                <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={profile.avatar || undefined} alt={profile.name} />
                  <AvatarFallback>{profile.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-4 text-white">
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                    <Sparkles className="h-4 w-4" />
                    Storyteller profile
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black leading-tight sm:text-4xl">{profile.name}</h1>
                    <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/80">
                      {roleLabel}
                    </span>
                  </div>
                  {profile.email && <p className="text-sm text-white/75">{profile.email}</p>}
                </div>
                <p className="max-w-2xl text-sm text-white/85 sm:text-base">{profileBio}</p>
                <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em] text-white/75">
                  <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                    Followers · {formatNumber(followersCount)}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                    Following · {formatNumber(followingCount)}
                  </span>
                  <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                    Views · {formatNumber(totalViews)}
                  </span>
                </div>
                {topicPreview.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-white/80">
                    {topicPreview.map((topic) => (
                      <span key={topic} className="rounded-full border border-white/40 bg-white/10 px-3 py-1">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <div className="rounded-[28px] border border-white/25 bg-white/10 px-8 py-6 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.8)]">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Stories live</p>
                <p className="text-4xl font-black text-white">{formatNumber(blogs.length)}</p>
                <p className="text-xs text-white/70">{storyLabel}</p>
              </div>
              <FollowButton
                userId={userId}
                className="rounded-full bg-white/90 px-8 py-3 text-sm font-semibold text-[#6C5CE7] shadow-[0_20px_60px_-45px_rgba(15,23,42,0.8)] transition hover:bg-white"
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
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#6C5CE7]">
                <Tag className="h-4 w-4" />
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
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
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
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
              {formatNumber(blogs.length)} {storyLabel}
            </span>
          </div>

          {blogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7]">
                <BookOpen className="h-10 w-10" />
              </div>
              <p className="text-lg font-semibold text-slate-800">No articles published yet</p>
              <p className="mt-2 text-sm text-slate-500">Check back soon for fresh writing from {profile.name}.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id || blog.id} blog={blog} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfileView;
