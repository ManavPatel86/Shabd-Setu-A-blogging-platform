import React, { useEffect, useMemo, useState } from "react";

import BlogCard from "@/components/BlogCard";
import CategoryBar from "@/components/CategoryBar";
import FeedTabs from "@/components/FeedTabs";
import FeaturedCard from "@/components/FeaturedCard";
import Loading from "@/components/Loading";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";

const CATEGORY_ICON_MAP = {
  technology: "💻",
  tech: "💻",
  travel: "✈️",
  science: "🔬",
  health: "🏥",
  design: "🎨",
  lifestyle: "🌿",
  entertainment: "🍿",
  business: "💼",
  finance: "💰",
  education: "📚",
  art: "🖼️",
};

const FALLBACK_CATEGORIES = [
  { name: "All", icon: "🌐" },
  { name: "Technology", icon: "💻" },
  { name: "Travel", icon: "✈️" },
  { name: "Design", icon: "🎨" },
  { name: "Health", icon: "🏥" },
  { name: "Lifestyle", icon: "🌿" },
];

const getBlogCategories = (blog) => {
  if (Array.isArray(blog?.categories)) return blog.categories.filter(Boolean);
  if (blog?.category) return [blog.category];
  return [];
};

const normalizeCategoryName = (name) => (typeof name === "string" ? name.trim() : "");

const detectCategoryIcon = (label) => {
  if (!label) return "📝";
  const emojiMatch = label.match(/\p{Extended_Pictographic}/u);
  if (emojiMatch) return emojiMatch[0];
  const mapped = CATEGORY_ICON_MAP[label.toLowerCase()];
  return mapped || "📝";
};

const isFollowingAuthor = (blog) =>
  Boolean(
    blog?.author?.isFollowing ||
      blog?.author?.isFollowed ||
      blog?.author?.isFollower ||
      blog?.author?.followStatus === "following" ||
      blog?.author?.youFollow
  );

const getEngagementScore = (blog) => {
  const likes = Number(
    blog?.likeCount ??
      blog?.likes ??
      blog?.likesCount ??
      blog?.stats?.likes ??
      0
  );
  const views = Number(blog?.viewCount ?? blog?.views ?? blog?.stats?.views ?? 0);
  const comments = Number(
    blog?.commentCount ?? blog?.commentsCount ?? blog?.stats?.comments ?? 0
  );

  return likes * 2 + views * 0.25 + comments * 1.5;
};

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeFeedTab, setActiveFeedTab] = useState("Latest");

  const blogsEndpoint = `${getEnv("VITE_API_BASE_URL")}/blog/blogs`;
  const { data: blogData, loading, error } = useFetch(
    blogsEndpoint,
    { method: "get", credentials: "include" },
    [blogsEndpoint]
  );

  const blogs = useMemo(
    () => (Array.isArray(blogData?.blog) ? blogData.blog : []),
    [blogData]
  );

  const orderedBlogs = useMemo(() => {
    return [...blogs].sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();
      const dateB = new Date(b?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [blogs]);

  const derivedCategories = useMemo(() => {
    if (!orderedBlogs.length) return FALLBACK_CATEGORIES;

    const seen = new Map();

    orderedBlogs.forEach((blog) => {
      getBlogCategories(blog).forEach((category) => {
        const rawName = normalizeCategoryName(category?.name || category);
        if (!rawName || seen.has(rawName)) return;
        seen.set(rawName, {
          name: rawName,
          icon: category?.icon || detectCategoryIcon(rawName),
        });
      });
    });

    const dynamic = Array.from(seen.values());
    const withAll = [{ name: "All", icon: "🌐" }, ...dynamic];

    return withAll.length > 1 ? withAll : FALLBACK_CATEGORIES;
  }, [orderedBlogs]);

  useEffect(() => {
    if (!derivedCategories.some((cat) => cat.name === activeCategory)) {
      setActiveCategory("All");
    }
  }, [derivedCategories, activeCategory]);

  const featuredBlog = useMemo(() => {
    return (
      orderedBlogs.find((blog) => blog?.isFeatured || blog?.featured) ||
      orderedBlogs[0]
    );
  }, [orderedBlogs]);

  const filteredBlogs = useMemo(() => {
    const byCategory = orderedBlogs.filter((blog) => {
      if (activeCategory === "All") return true;
      return getBlogCategories(blog).some((category) => {
        const rawName = normalizeCategoryName(category?.name || category);
        return rawName.toLowerCase() === activeCategory.toLowerCase();
      });
    });

    if (activeFeedTab === "Following") {
      const following = byCategory.filter(isFollowingAuthor);
      return following.length ? following : byCategory;
    }

    if (activeFeedTab === "Personalized") {
      return [...byCategory].sort(
        (a, b) => getEngagementScore(b) - getEngagementScore(a)
      );
    }

    return byCategory;
  }, [orderedBlogs, activeCategory, activeFeedTab]);

  if (loading) return <Loading />;

  return (
    <>
      <CategoryBar
        categories={derivedCategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      <div className="px-4 sm:px-8 lg:px-12 pt-6 pb-16">
        {featuredBlog && <FeaturedCard blog={featuredBlog} />}

        <FeedTabs
          activeFeedTab={activeFeedTab}
          setActiveFeedTab={setActiveFeedTab}
        />

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <BlogCard key={blog?._id} blog={blog} />
            ))
          ) : (
            <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
              <p className="text-lg font-semibold mb-2">
                {error ? "We hit a snag." : "No blogs match this view yet."}
              </p>
              <p className="text-sm">
                {error
                  ? "Please refresh or try again shortly."
                  : "Try switching categories or feed tabs to discover more content."}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Index;
