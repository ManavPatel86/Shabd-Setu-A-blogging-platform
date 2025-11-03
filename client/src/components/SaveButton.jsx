import React, { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";
import { RouteSignIn } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";

const SaveButton = ({ blogId, withLabel = false, className = "", size = "md" }) => {
    const isLoggedIn = useSelector((state) => state.user?.isLoggedIn);
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    const iconClass = useMemo(() => (size === "sm" ? "h-4 w-4" : "h-5 w-5"), [size]);

    useEffect(() => {
        if (!isLoggedIn) {
            setIsSaved(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        let ignore = false;

        const fetchStatus = async () => {
            if (!blogId || !isLoggedIn) {
                return;
            }

            try {
                const response = await fetch(
                    `${getEnv("VITE_API_BASE_URL")}/save/status/${blogId}`,
                    { method: "get", credentials: "include" }
                );
                const result = await response.json().catch(() => ({}));

                if (ignore) return;

                if (response.ok) {
                    setIsSaved(!!result?.isSaved);
                }
            } catch (error) {
                // Silent fail to avoid noisy UI; users can retry toggle.
            }
        };

        fetchStatus();

        return () => {
            ignore = true;
        };
    }, [blogId, isLoggedIn]);

    useEffect(() => {
        const handleSavedUpdate = (event) => {
            if (event.detail?.blogId === blogId) {
                setIsSaved(!!event.detail.isSaved);
            }
        };

        window.addEventListener("savedUpdated", handleSavedUpdate);
        return () => window.removeEventListener("savedUpdated", handleSavedUpdate);
    }, [blogId]);

    const handleToggle = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!blogId || loading) return;

        if (!isLoggedIn) {
            navigate(RouteSignIn);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${getEnv("VITE_API_BASE_URL")}/save/toggle/${blogId}`,
                { method: "POST", credentials: "include" }
            );
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast("error", result?.message || "Unable to update saved status.");
                return;
            }

            const nextState = !!result?.isSaved;
            setIsSaved(nextState);
            showToast("success", result?.message || (nextState ? "Blog saved." : "Removed from saved."));

            window.dispatchEvent(
                new CustomEvent("savedUpdated", {
                    detail: { blogId, isSaved: nextState },
                })
            );
        } catch (error) {
            showToast("error", error.message || "Unable to update saved status.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleToggle}
            className={`flex items-center gap-1 text-gray-600 hover:text-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from saved" : "Save blog"}
            disabled={loading}
        >
            {isSaved ? (
                <BookmarkCheck className={iconClass} />
            ) : (
                <Bookmark className={iconClass} />
            )}
            {withLabel && <span className="text-sm">{isSaved ? "Saved" : "Save"}</span>}
        </button>
    );
};

export default SaveButton;
