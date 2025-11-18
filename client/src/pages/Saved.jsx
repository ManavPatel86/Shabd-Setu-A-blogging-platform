import React, { useEffect, useMemo, useState } from "react";
import BlogCard from "@/components/BlogCard";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RouteSignIn } from "@/helpers/RouteName";
import { LayoutGrid, Rows3, Search, SlidersHorizontal } from "lucide-react";

const Saved = () => {
    const isLoggedIn = useSelector((state) => state.user?.isLoggedIn);
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [sortOption, setSortOption] = useState("recent");
    const [viewMode, setViewMode] = useState("grid");

    useEffect(() => {
        if (!isLoggedIn) {
            navigate(RouteSignIn, { replace: true });
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        const handleSavedUpdate = () => setRefreshKey((prev) => prev + 1);
        window.addEventListener("savedUpdated", handleSavedUpdate);
        return () => window.removeEventListener("savedUpdated", handleSavedUpdate);
    }, []);

    const requestUrl = useMemo(() => {
        if (!isLoggedIn) return null;
        return `${getEnv("VITE_API_BASE_URL")}/save`;
    }, [isLoggedIn]);

    const { data, loading } = useFetch(
        requestUrl,
        { method: "get", credentials: "include" },
        [requestUrl, refreshKey]
    );

    if (!isLoggedIn) {
        return null;
    }

    const savedBlogs = Array.isArray(data?.savedBlogs) ? data.savedBlogs : [];
    const statValue = (value) => (loading ? "—" : value);

    const extractCategories = (blog) => {
        if (Array.isArray(blog?.categories) && blog.categories.length > 0) {
            return blog.categories.map((category) => category?.name || category).filter(Boolean);
        }

        if (blog?.category) {
            if (Array.isArray(blog.category)) return blog.category.filter(Boolean);
            if (typeof blog.category === "string") return [blog.category];
            if (blog.category?.name) return [blog.category.name];
        }

        return ["Uncategorized"];
    };

    const categoryFrequency = useMemo(() => {
        const freq = savedBlogs.reduce((acc, blog) => {
            extractCategories(blog).forEach((label) => {
                acc[label] = (acc[label] || 0) + 1;
            });
            return acc;
        }, {});

        return Object.entries(freq).sort((a, b) => b[1] - a[1]);
    }, [savedBlogs]);

    const filteredBlogs = useMemo(() => {
        let list = [...savedBlogs];

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            list = list.filter((blog) => {
                const titleMatch = blog?.title?.toLowerCase().includes(query);
                const descriptionText = blog?.description?.toLowerCase?.() || "";
                const descMatch = descriptionText.includes(query);
                const categoryMatch = extractCategories(blog).some((label) => label.toLowerCase().includes(query));
                return titleMatch || descMatch || categoryMatch;
            });
        }

        if (activeCategory !== "all") {
            list = list.filter((blog) =>
                extractCategories(blog).some((label) => label === activeCategory)
            );
        }

        list.sort((a, b) => {
            const dateA = new Date(a?.createdAt || 0).getTime();
            const dateB = new Date(b?.createdAt || 0).getTime();

            switch (sortOption) {
                case "oldest":
                    return dateA - dateB;
                case "title":
                    return (a?.title || "").localeCompare(b?.title || "");
                default:
                    return dateB - dateA;
            }
        });

        return list;
    }, [savedBlogs, searchTerm, activeCategory, sortOption]);

    const visibleCount = filteredBlogs.length;

    const SavedSkeletonCard = () => (
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] animate-pulse">
            <div className="relative w-full h-52 rounded-3xl bg-gray-100/90">
                <div className="absolute flex gap-2 right-4 top-4">
                    <span className="w-16 h-6 rounded-xl bg-white/70" />
                    <span className="w-16 h-6 rounded-xl bg-white/70" />
                </div>
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 rounded-full h-11 w-11" />
                    <div className="space-y-2">
                        <div className="h-3.5 w-28 rounded-full bg-gray-100" />
                        <div className="w-16 h-3 rounded-full bg-gray-100/80" />
                    </div>
                </div>
                <div className="h-3 rounded-full w-28 bg-gray-100/80" />
            </div>

            <div className="space-y-2">
                <div className="w-5/6 h-4 rounded-full bg-gray-100/90" />
                <div className="w-2/3 h-4 rounded-full bg-gray-100/70" />
            </div>

            <div className="pt-2 space-y-3">
                <div className="flex gap-3">
                    <div className="flex-1 h-10 rounded-2xl bg-gray-100/90" />
                    <div className="flex-1 h-10 bg-white border border-gray-100 rounded-2xl" />
                </div>
                <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-2xl bg-white/80">
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-8 bg-gray-100 rounded-2xl" />
                        <div className="w-12 h-8 rounded-2xl bg-gray-50" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-8 bg-gray-100 rounded-2xl" />
                        <div className="w-12 h-8 bg-white border border-gray-100 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );

    const cardsWrapperClass =
        viewMode === "grid"
            ? "grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3"
            : "space-y-8";

    return (
        <div className="px-4 pt-6 pb-16 space-y-10 text-gray-900 sm:px-8 lg:px-12">
            <section className="relative mt-4 overflow-hidden rounded-[40px] bg-[#6C5CE7] px-5 py-8 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.85)] sm:px-8 lg:px-12 lg:py-10">
                <div className="absolute top-0 right-0 rounded-full h-80 w-80 translate-x-1/3 -translate-y-1/3 bg-white/10 blur-3xl" />
                <div className="absolute rounded-full -bottom-24 -left-10 h-72 w-72 bg-purple-300/25 blur-3xl" />
                <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-5 text-center lg:text-left">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Dashboard • Saved</p>
                        <h1 className="text-4xl font-black leading-tight sm:text-5xl">Saved Blogs</h1>
                        <p className="max-w-2xl text-sm text-white/85 sm:text-base">
                            Curate inspiration, keep your learning streak alive, and return to every spark you’ve bookmarked.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                            <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-white/80">
                                {statValue(savedBlogs.length)} saved
                            </span>
                        </div>
                    </div>
                    <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto lg:grid-cols-1">
                        {[{
                            label: "Saved posts",
                            value: statValue(savedBlogs.length),
                            helper: "ready to revisit",
                        }].map((card) => (
                            <div
                                key={card.label}
                                className={`rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/80 backdrop-blur ${
                                    loading ? "animate-pulse" : ""
                                }`}
                            >
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">{card.label}</p>
                                <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
                                <p className="text-xs text-white/70">{card.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-gray-100 bg-white/80 px-4 py-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-4 py-2.5 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search saved titles or categories"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 text-sm text-gray-700 bg-transparent placeholder:text-gray-400 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center w-full gap-3 sm:flex-nowrap lg:w-auto">
                        <div className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.35em] text-gray-500 sm:w-auto">
                            {loading ? "—" : `${visibleCount} shown`}
                        </div>
                        <div className="flex items-center w-full gap-1 px-2 py-1 bg-white border border-gray-200 rounded-2xl sm:w-auto">
                            <button
                                type="button"
                                className={`inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold ${
                                    viewMode === "grid" ? "bg-[#6C5CE7] text-white shadow" : "text-gray-500"
                                }`}
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                type="button"
                                className={`inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold ${
                                    viewMode === "list" ? "bg-[#6C5CE7] text-white shadow" : "text-gray-500"
                                }`}
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                            >
                                <Rows3 size={16} />
                            </button>
                        </div>
                        <div className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 shadow-sm rounded-2xl sm:w-auto">
                            <SlidersHorizontal size={16} className="text-gray-400" />
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="w-full text-sm text-gray-700 bg-transparent focus:outline-none"
                            >
                                <option value="recent">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="title">Title A-Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pb-1 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveCategory("all")}
                        className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                            activeCategory === "all"
                                ? "border-[#6C5CE7] bg-[#6C5CE7]/10 text-[#6C5CE7]"
                                : "border-gray-200 text-gray-500 hover:border-[#6C5CE7]/40"
                        }`}
                    >
                        All categories
                    </button>
                    {categoryFrequency.slice(0, 6).map(([label, count]) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => setActiveCategory(label)}
                            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                activeCategory === label
                                    ? "border-[#6C5CE7] bg-[#6C5CE7]/10 text-[#6C5CE7]"
                                    : "border-gray-200 text-gray-600 hover:border-[#6C5CE7]/40"
                            }`}
                        >
                            {label}
                            <span className="ml-1 text-[11px] font-normal text-gray-400">• {count}</span>
                        </button>
                    ))}
                </div>
            </section>

            {loading ? (
                <section className="space-y-6">
                    <div className="flex flex-col gap-2 px-6 py-4 text-sm text-gray-500 border border-gray-100 shadow-sm rounded-3xl bg-white/70 backdrop-blur animate-pulse sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-1/3 h-4 rounded-full bg-gray-100/80" />
                        <div className="w-16 h-3 rounded-full bg-gray-100/70" />
                    </div>
                    <div className={cardsWrapperClass}>
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <SavedSkeletonCard key={`saved-skeleton-${idx}`} />
                        ))}
                    </div>
                </section>
            ) : filteredBlogs.length > 0 ? (
                <section className="space-y-6">
                    <div className="flex flex-col gap-2 px-6 py-4 text-sm text-gray-500 border border-gray-100 shadow-sm rounded-3xl bg-white/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-gray-700">
                            Dive back into your collection
                            {activeCategory !== "all" && ` • ${activeCategory}`}
                        </p>
                        <span className="text-xs uppercase tracking-[0.35em] text-gray-400">{filteredBlogs.length} shown</span>
                    </div>
                    <div className={cardsWrapperClass}>
                        {filteredBlogs.map((blog) => (
                            <BlogCard key={blog._id} blog={blog} />
                        ))}
                    </div>
                </section>
            ) : (
                <section className="max-w-lg px-10 py-16 mx-auto text-center border border-gray-300 border-dashed shadow-inner rounded-3xl bg-gray-50/80">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-[#6C5CE7] shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                            <path d="M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2Z" />
                        </svg>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">No saved blogs yet</p>
                    <p className="mt-2 text-sm text-gray-500">Tap the bookmark icon on any article to build your personal reading stack.</p>
                </section>
            )}
        </div>
    );
};

export default Saved;
