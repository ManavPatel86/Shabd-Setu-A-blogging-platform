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
            <div className="pb-3 border-b mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Latest Blogs</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Showing posts in {categoryData?.name || "this category"}.
                </p>
            </div>

            <div className="space-y-5">
                {blogs.length > 0 ? (
                    blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No blogs found in this category yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryFeed;
