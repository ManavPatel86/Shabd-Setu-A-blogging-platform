import BlogCard from "@/components/BlogCard";
import Loading from "@/components/Loading";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import React, { useMemo, useState } from "react";
import RelatedBlog from '@/components/RelatedBlog'

const Index = () => {
  const feedTabs = useMemo(
    () => [
      {
        key: "latest",
        label: "Latest",
        description: "Fresh posts from the entire community.",
      },
      {
        key: "following",
        label: "Following",
        description: "Updates from creators you follow.",
      },
      {
        key: "personalized",
        label: "Personalized",
        description: "Recommendations powered by your likes and saves.",
      },
    ],
    []
  );

  const [activeFeed, setActiveFeed] = useState("latest");

  const baseUrl = getEnv("VITE_API_BASE_URL");
  const feedUrlMap = useMemo(
    () => ({
      latest: `${baseUrl}/blog/blogs`,
      following: `${baseUrl}/blog/following`,
      personalized: `${baseUrl}/blog/get-personalized-home`,
    }),
    [baseUrl]
  );

  const feedUrl = feedUrlMap[activeFeed];
  const shouldFetch = Boolean(feedUrl);

  const {
    data: blogData,
    loading,
    error,
  } = useFetch(shouldFetch ? feedUrl : null, shouldFetch ? { method: "get", credentials: "include" } : {}, [activeFeed, feedUrl]);

  const renderFeedContent = () => {
    if (loading) return <Loading />;

    if (error) {
      const isUnauthorized = error.message?.includes("401");
      if ((activeFeed === "following" || activeFeed === "personalized") && isUnauthorized) {
        return (
          <div className="text-center py-10 text-gray-500">
            Sign in to unlock this feed.
          </div>
        );
      }

      return (
        <div className="text-center py-10 text-red-500">{error.message}</div>
      );
    }

    const blogs = Array.isArray(blogData?.blog) ? blogData.blog : [];

    if (!blogs.length) {
      const defaultMessage =
        activeFeed === "following"
          ? "No posts from creators you follow yet."
          : activeFeed === "personalized"
          ? blogData?.meta?.message || "Interact with a few posts to personalize your feed."
          : "No blogs found.";

      return <div className="text-center py-10 text-gray-500">{defaultMessage}</div>;
    }

    return blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />);
  };

  const activeTab = feedTabs.find((tab) => tab.key === activeFeed);

  return (
    <div className="w-full">
      <div className="pb-3 border-b mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {feedTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFeed(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
                activeFeed === tab.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 hover:bg-indigo-50 border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          {activeTab ? `${activeTab.label} Feed` : "Blogs"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {activeTab?.description}
        </p>
        {activeFeed === "personalized" && !loading && blogData?.meta?.message && (
          <p className="text-xs text-indigo-500 mt-1">{blogData.meta.message}</p>
        )}
      </div>

      <div className="md:flex md:items-start md:gap-8">
        <main className="md:flex-1 space-y-5">{renderFeedContent()}</main>

        <aside className="md:w-80 mt-8 md:mt-0">
          <div className="sticky top-24">
            <h3 className="text-xl font-semibold mb-3">Recommended for you</h3>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <RelatedBlog hideCloseButton={true} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Index;
