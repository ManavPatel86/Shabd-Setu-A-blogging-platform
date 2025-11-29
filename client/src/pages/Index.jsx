import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import BlogCard from "@/components/BlogCard";
import CategoryBar from "@/components/CategoryBar";
import FeedTabs from "@/components/FeedTabs";
import FeaturedCard from "@/components/FeaturedCard";
import Loading from "@/components/Loading";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";

/* ----------------------
   CATEGORY HELPERS (UI)
----------------------- */
const FALLBACK_CATEGORIES = [
  "All",
  "Technology",
  "Travel",
  "Design",
  "Health",
  "Lifestyle",
];

const getBlogCategories = (blog) => {
  if (Array.isArray(blog?.categories)) return blog.categories.filter(Boolean);
  if (blog?.category) return [blog.category];
  return [];
};

const normalizeCategoryName = (name) => (typeof name === "string" ? name.trim() : "");

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }
  return null;
};

const isFollowingAuthor = (blog, followingIds) => {
  if (!blog) return false;

  const idsToCheck = [
    blog?.author?._id,
    blog?.author?.id,
    blog?.author?.userId,
  ]
    .map(normalizeId)
    .filter(Boolean);

  if (followingIds && followingIds.size && idsToCheck.length) {
    return idsToCheck.some((id) => followingIds.has(id));
  }

  return Boolean(
    blog?.author?.isFollowing ||
      blog?.author?.isFollowed ||
      blog?.author?.isFollower ||
      blog?.author?.followStatus === "following" ||
      blog?.author?.youFollow
  );
};

/* ----------------------
    FINAL PAGE
---------------------- */
const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFeedTab, setActiveFeedTab] = useState("Latest");
  const currentUserId = useSelector((state) => state.user?.user?._id);

  /* ----------------------------
        BACKEND FETCH (MAIN)
  ---------------------------- */
  const blogsEndpoint = `${getEnv("VITE_API_BASE_URL")}/blog/blogs`;

  const { data: blogData, loading, error } = useFetch(
    blogsEndpoint,
    { method: "get", credentials: "include" },
    [blogsEndpoint]
  );

  const blogs = useMemo(
    () => (Array.isArray(blogData?.blogs) ? blogData.blogs : Array.isArray(blogData?.blog) ? blogData.blog : []),
    [blogData]
  );

  /* ----------------------------
        PERSONALIZED FEED
  ---------------------------- */
  const personalizedEndpoint = currentUserId
    ? `${getEnv("VITE_API_BASE_URL")}/blog/get-personalized-home`
    : null;

  const {
    data: personalizedData,
    loading: personalizedLoading,
    error: personalizedError,
  } = useFetch(
    personalizedEndpoint,
    { method: "get", credentials: "include" },
    [personalizedEndpoint]
  );

  const personalizedBlogs = useMemo(
    () => (Array.isArray(personalizedData?.blog) ? personalizedData.blog : []),
    [personalizedData]
  );
  const personalizationMessage = personalizedData?.meta?.message;

  /* ----------------------------
        FOLLOWING FETCH (UI)
  ---------------------------- */
  const followingEndpoint = currentUserId
    ? `${getEnv("VITE_API_BASE_URL")}/follow/following/${currentUserId}`
    : null;

  const { data: followingData } = useFetch(
    followingEndpoint,
    { method: "get", credentials: "include" },
    [followingEndpoint]
  );

  const followingIds = useMemo(() => {
    if (!Array.isArray(followingData?.following)) return new Set();
    return new Set(
      followingData.following
        .map((user) => normalizeId(user?._id || user?.id || user?.userId))
        .filter(Boolean)
    );
  }, [followingData]);

  const filterByCategory = useCallback(
    (list = []) => {
      const safeList = Array.isArray(list) ? list.filter(Boolean) : [];
      if (activeCategory === "All") {
        return safeList;
      }

      return safeList.filter((blog) =>
        getBlogCategories(blog).some((cat) => {
          const raw = normalizeCategoryName(cat?.name || cat);
          return raw.toLowerCase() === activeCategory.toLowerCase();
        })
      );
    },
    [activeCategory]
  );

  /* ------------------------------------
      ORDER BY NEWEST FIRST (UI logic)
  ------------------------------------ */
  const orderedBlogs = useMemo(() => {
    return [...blogs].sort((a, b) => {
      const A = new Date(a?.createdAt || 0).getTime();
      const B = new Date(b?.createdAt || 0).getTime();
      return B - A;
    });
  }, [blogs]);

  /* ------------------------------------
      BUILD CATEGORY LIST (UI logic)
  ------------------------------------ */
  const derivedCategories = useMemo(() => {
    if (!orderedBlogs.length) return FALLBACK_CATEGORIES;

    const seen = new Map();

    orderedBlogs.forEach((blog) => {
      getBlogCategories(blog).forEach((category) => {
        const rawName = normalizeCategoryName(category?.name || category);
        if (!rawName) return;
        const key = rawName.toLowerCase();
        if (key === "all" || seen.has(key)) return;
        seen.set(key, rawName);
      });
    });

    const dynamic = Array.from(seen.values());
    const withAll = ["All", ...dynamic];

    return withAll.length > 1 ? withAll : FALLBACK_CATEGORIES;
  }, [orderedBlogs]);

  // Reset activeCategory if invalid
  useEffect(() => {
    if (!derivedCategories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [derivedCategories, activeCategory]);

  /* ------------------------------------
      FEATURED BLOG
  ------------------------------------ */
  const featuredBlog = useMemo(() => {
    return (
      orderedBlogs.find((b) => b?.isFeatured || b?.featured) ||
      orderedBlogs[0]
    );
  }, [orderedBlogs]);

  /* ------------------------------------
      FILTERING (UI logic)
  ------------------------------------ */
  const categoryFilteredBlogs = useMemo(
    () => filterByCategory(orderedBlogs),
    [filterByCategory, orderedBlogs]
  );

  const personalizedFilteredBlogs = useMemo(
    () => filterByCategory(personalizedBlogs),
    [filterByCategory, personalizedBlogs]
  );

  const filteredBlogs = useMemo(() => {
    if (activeFeedTab === "Following") {
      return categoryFilteredBlogs.filter((blog) =>
        isFollowingAuthor(blog, followingIds)
      );
    }

    if (activeFeedTab === "Personalized") {
      if (!currentUserId || personalizedError) {
        return [];
      }

      if (personalizedFilteredBlogs.length) {
        return personalizedFilteredBlogs;
      }

      return [];
    }

    return categoryFilteredBlogs;
  }, [
    activeFeedTab,
    categoryFilteredBlogs,
    currentUserId,
    followingIds,
    personalizedError,
    personalizedFilteredBlogs,
  ]);

  const activeFeedMessage = useMemo(() => {
    if (activeFeedTab === "Personalized") {
      if (!currentUserId) {
        return "Sign in to get personalized recommendations.";
      }
      if (personalizedError) {
        return "We couldn't load your personalized feed. Try refreshing.";
      }
      return personalizationMessage || null;
    }

    if (activeFeedTab === "Following" && !followingIds.size) {
      return "Follow authors to populate this feed.";
    }

    return null;
  }, [
    activeFeedTab,
    currentUserId,
    followingIds.size,
    personalizationMessage,
    personalizedError,
  ]);

  // Only show loading on initial load (no data yet)
  if (loading && !blogs.length && !error) return <Loading />;
  if (activeFeedTab === "Personalized" && personalizedLoading && !personalizedBlogs.length && !personalizedError) return <Loading />;

  return (
    <>
      {/* Category Selector */}
      <CategoryBar
        categories={derivedCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="px-4 pt-4 pb-12 sm:px-8 lg:px-12 sm:pt-6 sm:pb-16">
        {/* Featured Hero Slider */}
        <FeaturedCard />

        {/* Feed Tabs */}
        <FeedTabs
          activeFeedTab={activeFeedTab}
          setActiveFeedTab={setActiveFeedTab}
        />

        <div className="flex flex-col gap-2 px-5 py-3 mt-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Total blogs
            </span>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-medium border rounded-full border-slate-200 bg-slate-50 text-slate-500">
                {activeCategory === "All" ? "All categories" : activeCategory}
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {filteredBlogs.length}
              </span>
            </div>
          </div>
          {activeFeedMessage && (
            <p className="text-sm text-slate-500">{activeFeedMessage}</p>
          )}
        </div>

        {/* BLOG GRID */}
        <section className="grid grid-cols-1 gap-8 pt-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <BlogCard key={blog?._id} blog={blog} />
            ))
          ) : (
            <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 border-dashed col-span-full rounded-3xl">
              <p className="mb-2 text-lg font-semibold">
                {error ? "We hit a snag." : "No blogs match this view yet."}
              </p>
              <p className="text-sm">
                {error
                  ? "Please refresh or try again shortly."
                  : activeFeedMessage || "Try switching categories or feed tabs to discover more content."}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Index;