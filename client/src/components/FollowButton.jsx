import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEnv } from "@/helpers/getEnv";
import { showToast } from "@/helpers/showToast";
import { Button } from "./ui/button";

const FollowButton = ({ userId, className = "" }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const currentUser = useSelector((state) => state.user?.user);

  useEffect(() => {
    checkFollowStatus();
  }, [userId]);

  const checkFollowStatus = async () => {
    if (!currentUser?._id || currentUser._id === userId) {
      setChecking(false);
      return;
    }

    try {
      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/follow/check/${userId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser?._id) {
      showToast("error", "Please login to follow users");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/follow/${endpoint}/${userId}`,
        {
          method,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsFollowing(!isFollowing);
        showToast("success", data.message);
      } else {
        showToast("error", data.message);
      }
    } catch (error) {
      showToast("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (currentUser?._id === userId) {
    return null;
  }

  if (checking) {
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      className={className}
      variant={isFollowing ? "outline" : "default"}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default FollowButton;
