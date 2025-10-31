import BlogCard from "@/components/BlogCard";
import Loading from "@/components/Loading";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import React from "react";

const Index = () => {
  const { data: blogData, loading } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/blog/blogs`,
    { method: "get", credentials: "include" }
  );

  if (loading) return <Loading />;

  const blogs = blogData?.blog || [];

  return (
    <div className="w-full">
      
      {/* Latest Blogs Title + Underline */}
      <div className="pb-3 border-b mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Latest Blogs</h2>
      </div>

      {/* Blog List */}
      <div className="space-y-5">
        {blogs.length > 0 ? (
          blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
        ) : (
          <div className="text-center py-10 text-gray-500">
            No blogs found.
          </div>
        )}
      </div>

    </div>
  );
};

export default Index;
