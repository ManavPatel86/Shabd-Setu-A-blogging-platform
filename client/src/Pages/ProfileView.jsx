import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import Loading from "@/components/Loading";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import BlogCard from "@/components/BlogCard";

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

  const profile = userData?.user;
  const blogs = blogData?.blog || [];

  const { totalViews, categoryLabels } = useMemo(() => {
    const views = blogs.reduce((acc, item) => acc + (item.views || 0), 0);
    const labels = Array.from(
      new Set(
        blogs
          .map((item) => item.category?.name)
          .filter((label) => Boolean(label))
      )
    );
    return { totalViews: views, categoryLabels: labels };
  }, [blogs]);

  if (userLoading || blogsLoading) {
    return <Loading />;
  }

  if (userError || blogsError) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative h-24">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoMnYyaC0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          </div>
          
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-4 ring-blue-100">
                <AvatarImage src={profile.avatar} alt={profile.name} />
              </Avatar>
              
              <div className="flex-1 text-center sm:text-left pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {roleLabel}
                  </span>
                </div>
                {profile.email && (
                  <p className="text-gray-600 mb-2">{profile.email}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-700 leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-3xl font-bold text-blue-600">{blogs.length}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {blogs.length === 1 ? "Article" : "Articles"}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">{totalViews}</p>
                <p className="text-sm text-gray-600 mt-1">Total Views</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl col-span-2 sm:col-span-1">
                <p className="text-3xl font-bold text-green-600">{categoryLabels.length}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryLabels.length === 1 ? "Category" : "Categories"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categoryLabels.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              Writing Topics
            </h2>
            <div className="flex flex-wrap gap-2">
              {categoryLabels.map((label) => (
                <span
                  key={label}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Articles Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-8 bg-blue-600 rounded-full"></span>
              Published Articles
            </h2>
            {blogs.length > 0 && (
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {blogs.length} {blogs.length === 1 ? "post" : "posts"}
              </span>
            )}
          </div>
          
          {blogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No articles published yet</p>
              <p className="text-gray-400 text-sm mt-2">Check back later for new content!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
