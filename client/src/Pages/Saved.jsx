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
        <div className="w-full">
            <div className="pb-3 border-b mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">Saved Blogs</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Access posts you've bookmarked for later.
                </p>
            </div>

            <div className="space-y-5">
                {savedBlogs.length > 0 ? (
                    savedBlogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        You haven't saved any blogs yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Saved;
