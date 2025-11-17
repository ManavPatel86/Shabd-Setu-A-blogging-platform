import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import { useNavigate } from "react-router-dom";
import { RouteProfileView } from "@/helpers/RouteName";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/helpers/showToast";

import {
  Sparkles,
  UserMinus,
  Users,
} from "lucide-react";

const Following = () => {
  const currentUser = useSelector((state) => state.user?.user);
  const navigate = useNavigate();

  const [unfollowingId, setUnfollowingId] = useState(null);
  const [followingList, setFollowingList] = useState([]);

  // ------------------------------
  // FETCH FOLLOWING LIST (MAIN LOGIC)
  // ------------------------------
  const requestUrl = currentUser?._id
    ? `${getEnv("VITE_API_BASE_URL")}/follow/following/${currentUser._id}`
    : null;

  const { data, loading, error } = useFetch(
    requestUrl,
    { method: "get", credentials: "include" },
    [requestUrl]
  );

  React.useEffect(() => {
    if (!requestUrl) return setFollowingList([]);
    if (Array.isArray(data?.following)) {
      setFollowingList(data.following.filter(Boolean));
    } else {
      setFollowingList([]);
    }
  }, [data, requestUrl]);

  // ------------------------------
  // UNFOLLOW USER (MAIN LOGIC)
  // ------------------------------
  const handleUnfollow = async (userId) => {
    setUnfollowingId(userId);

    try {
      const res = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/follow/unfollow/${userId}`,
        { method: "DELETE", credentials: "include" }
      );

      const result = await res.json();

      if (res.ok) {
        setFollowingList((prev) => prev.filter((u) => u._id !== userId));
        showToast("success", result.message);
      } else showToast("error", result.message);
    } catch {
      showToast("error", "Failed to unfollow user");
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(RouteProfileView(userId));
  };

  const totalFollowing = followingList.length;

  const formatCount = (value) => {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 0;
    }
    if (numeric >= 1000) {
      return `${(numeric / 1000).toFixed(1)}k`;
    }
    return numeric;
  };

  // ------------------------------
  // MAIN branch redirects
  // ------------------------------
  if (!currentUser?._id) {
    return (
      <div className="text-center py-10 text-gray-500">
        Please sign in to view who you're following.
      </div>
    );
  }

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Unable to load following list right now.
      </div>
    );
  }

  // ------------------------------
  // FINAL UI (UI branch design)
  // ------------------------------
  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-6 sm:px-10 py-10 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-16 w-64 h-64 bg-purple-300/40 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
              <Sparkles className="h-4 w-4" />
              Curated circle
            </p>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">
              Following
            </h1>

            <p className="text-sm sm:text-base text-white/85">
              Stay close to the creators who fuel your curiosity. Every follow brings their freshest stories into your reading flow.
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur">
                <Users className="h-4 w-4" /> Following · {totalFollowing}
              </span>
            </div>
          </div>

          <div className="rounded-4xl border border-white/25 bg-white/10 px-8 py-6 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.8)]">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">
              Following
            </p>
            <p className="text-4xl font-black text-white">
              {totalFollowing}
            </p>
            <p className="text-xs text-white/70">creators in your circle</p>
          </div>
        </div>
      </section>
      {/* FOLLOWING LIST */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Your creative circle
          </h2>
          <p className="text-sm text-slate-500">
            Tap a profile to open their storyteller page, unfollow directly, or plan your next collaboration.
          </p>
        </div>

        {followingList.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-slate-200 bg-white/80 p-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7]">
              <UserMinus className="h-12 w-12" />
            </div>
            <p className="text-lg font-semibold text-slate-800">
              You're not following anyone yet
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Discover authors, follow their journeys, and their newest pieces will land here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {followingList.map((user, idx) => {
              const followerCount = formatCount(
                user?.followersCount ?? user?.followers?.length ?? 0
              );
              const storyCount = formatCount(
                user?.blogCount ?? user?.blogs?.length ?? 0
              );
              const isVerified = Boolean(user?.isVerified);

              return (
                <div
                  key={user?._id || idx}
                  className="rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] hover:border-[#6C5CE7]/40 transition-colors"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div
                      className="flex flex-1 items-start gap-4 cursor-pointer"
                      onClick={() =>
                        user?._id && handleProfileClick(user._id)
                      }
                    >
                      <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={user?.avatar ?? undefined}
                          alt={user?.name ?? "User"}
                        />
                        <AvatarFallback>
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {user?.name || "Unknown"}
                          </h3>

                          {isVerified && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Verified
                            </span>
                          )}
                        </div>

                        {user?.email && (
                          <p className="text-sm text-slate-500 truncate">
                            {user.email}
                          </p>
                        )}

                        <p className="text-sm text-slate-500">
                          {user?.bio?.trim() ||
                            "This author hasn’t shared a bio yet."}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em] text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            Followers · {followerCount}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            Stories · {storyCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          user?._id && handleProfileClick(user._id)
                        }
                        className="rounded-full px-6 text-sm text-[#6C5CE7] hover:bg-[#6C5CE7]/10"
                      >
                        View profile
                      </Button>

                      <Button
                        onClick={() =>
                          user?._id && handleUnfollow(user._id)
                        }
                        disabled={
                          unfollowingId === user?._id || !user?._id
                        }
                        className="rounded-full bg-[#6C5CE7] px-6 text-sm text-white hover:bg-[#5b4dd4]"
                      >
                        {unfollowingId === user?._id
                          ? "Unfollowing..."
                          : "Unfollow"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Following;