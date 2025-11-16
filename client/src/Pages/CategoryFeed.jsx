import React from "react";
import { useParams } from "react-router-dom";
import Loading from "@/components/Loading";
import BlogCard from "@/components/BlogCard";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";

const CategoryFeed = () => {
    const { category } = useParams();
    const requestUrl = category
        ? `${getEnv("VITE_API_BASE_URL")}/blog/get-blog-by-category/${category}`
        : null;

    const { data, loading, error } = useFetch(
        requestUrl,
        { method: "get", credentials: "include" },
        [requestUrl]
    );

    if (!category) {
        return (
            <div className="text-center py-10 text-gray-500">
                Category not specified.
            </div>
        );
    }

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500">
                Unable to load blogs for this category right now.
            </div>
        );
    }

    const blogs = Array.isArray(data?.blog) ? data.blog : [];
    const categoryData = data?.categoryData;

    return (
        <div className="w-full">
            <div className="pb-4 border-b mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Latest Blogs</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Showing posts in {categoryData?.name || "this category"}.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {blogs.length > 0 ? (
                    blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
                ) : (
                    <div className="text-center py-16 text-gray-500 col-span-full">
                        <p className="text-lg">No blogs found in this category yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryFeed;
