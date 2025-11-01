import React, { useState, useEffect, useRef } from "react";
import { getEnv } from "@/helpers/getEnv";
import { Eye } from "lucide-react";

const ViewCount = ({ blogId, addView = false }) => {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasAddedViewRef = useRef(false);
  const lastBlogIdRef = useRef(null);
  const apiUrl = getEnv("VITE_API_BASE_URL");

  useEffect(() => {
    let isMounted = true;

    if (lastBlogIdRef.current !== blogId) {
      lastBlogIdRef.current = blogId;
      hasAddedViewRef.current = false;
    }

    const fetchAndAddView = async () => {
      try {
        // Add a view once per mount when requested
        if (addView && !hasAddedViewRef.current) {
          hasAddedViewRef.current = true;

          await fetch(`${apiUrl}/view/add-view`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ blogId }),
          }).catch((error) => {
            console.error("Failed to add view", error);
          });
        }

        // Always fetch the latest count
        const response = await fetch(`${apiUrl}/view/${blogId}`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          setViewCount(data.viewCount || 0);
        }
      } catch (error) {
        console.error("Error with view count:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (blogId) {
      fetchAndAddView();
    }

    return () => {
      isMounted = false;
    };
  }, [blogId, apiUrl, addView]);

  if (loading) {
    return <span>...</span>;
  }

  return <span>{viewCount}</span>;
};

export default ViewCount;
