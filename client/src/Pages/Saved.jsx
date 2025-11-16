import React, { useEffect, useMemo, useState } from "react";
import Loading from "@/components/Loading";
import BlogCard from "@/components/BlogCard";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RouteSignIn } from "@/helpers/RouteName";

const Saved = () => {
    const isLoggedIn = useSelector((state) => state.user?.isLoggedIn);
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);

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

    if (loading) return <Loading />;

    const savedBlogs = data?.savedBlogs || [];

    return (
        <div className="w-full pt-4">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Blogs</h1>
                <p className="text-gray-600">
                    {savedBlogs.length} posts saved
                </p>
            </div>

            {/* Blog Grid */}
            {savedBlogs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {savedBlogs.map((blog) => (
                        <BlogCard key={blog._id} blog={blog} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">You haven't saved any blogs yet.</p>
                    <p className="text-sm mt-2">Save blogs to read them later.</p>
                </div>
            )}
        </div>
    );
};

export default Saved;
