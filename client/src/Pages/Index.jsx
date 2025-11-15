import BlogCard from "@/components/BlogCard";
import Loading from "@/components/Loading";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import React from "react";
import RelatedBlog from '@/components/RelatedBlog'

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

      <div className="md:flex md:items-start md:gap-8">
        <main className="md:flex-1 space-y-5">
          {blogs.length > 0 ? (
            blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
          ) : (
            <div className="text-center py-10 text-gray-500">No blogs found.</div>
          )}
        </main>

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
