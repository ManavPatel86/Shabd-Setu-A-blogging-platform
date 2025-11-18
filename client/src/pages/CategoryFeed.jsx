import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import Loading from "@/components/Loading";
import BlogCard from "@/components/BlogCard";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import {
    Sparkles,
    Layers,
    Flame,
    Compass,
} from "lucide-react";

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

    const blogs = useMemo(
        () => (Array.isArray(data?.blog) ? data.blog : []),
        [data?.blog]
    );

    const categoryData = data?.categoryData;
    const categoryName = categoryData?.name || category;

    const stats = useMemo(
        () => [
            {
                label: "Entries",
                value: blogs.length,
                helper: "published in this topic",
                icon: <Layers className="h-4 w-4" />,
            },
            {
                label: "Fresh picks",
                value: Math.min(blogs.length, 6),
                helper: "curated this week",
                icon: <Flame className="h-4 w-4" />,
            },
            {
                label: "Explore",
                value: "See more",
                helper: "discover related tags",
                icon: <Compass className="h-4 w-4" />,
            },
        ],
        [blogs.length]
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

    return (
        <div className="space-y-12 text-gray-900">
            <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] px-6 py-10 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.9)] sm:px-10">
                <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-purple-300/35 blur-3xl" />
                <div className="relative space-y-6">
                    <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                        <Sparkles className="h-4 w-4" />
                        Category Hub
                    </p>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                            {categoryName}
                        </h1>
                        <p className="max-w-2xl text-sm text-white/85 sm:text-base">
                            Browse every story we’ve curated under this topic. Save what inspires you, and follow writers exploring the same lanes.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-3xl border border-white/25 bg-white/10 px-5 py-4 text-sm text-white/85 backdrop-blur"
                            >
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/70">
                                    {stat.icon}
                                    {stat.label}
                                </div>
                                <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-xs text-white/70">{stat.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400">Collection</p>
                        <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Latest in {categoryName}</h2>
                        <p className="text-sm text-gray-500">
                            {blogs.length > 0
                                ? `Showing ${blogs.length} curated posts`
                                : "No entries yet—check back soon."}
                        </p>
                    </div>
                    {blogs.length > 0 && (
                        <div className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
                            Updated now
                        </div>
                    )}
                </div>

                {blogs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {blogs.map((blog) => (
                            <BlogCard key={blog._id} blog={blog} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-10 py-16 text-center text-gray-500">
                        No blogs found in this category yet.
                    </div>
                )}
            </section>
        </div>
    );
};

export default CategoryFeed;
