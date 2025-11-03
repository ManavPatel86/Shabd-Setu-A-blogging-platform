import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import { useNavigate } from "react-router-dom";
import { RouteProfileView } from "@/helpers/RouteName";
import Loading from "@/components/Loading";
import { Avatar } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Button } from "@/components/ui/button";
import { showToast } from "@/helpers/showToast";
import { UserMinus } from "lucide-react";

const Following = () => {
  const currentUser = useSelector((state) => state.user?.user);
  const navigate = useNavigate();
  const [unfollowingId, setUnfollowingId] = useState(null);
  const [followingList, setFollowingList] = useState([]);

  const { data, loading, error } = useFetch(
    `${getEnv("VITE_API_BASE_URL")}/follow/following/${currentUser?._id}`,
    {
      method: "get",
      credentials: "include",
    },
    [currentUser?._id]
  );

  React.useEffect(() => {
    if (data?.following) {
      setFollowingList(data.following);
    }
  }, [data]);

  const handleUnfollow = async (userId) => {
    setUnfollowingId(userId);
    try {
      const response = await fetch(
        `${getEnv("VITE_API_BASE_URL")}/follow/unfollow/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setFollowingList((prev) => prev.filter((user) => user._id !== userId));
        showToast("success", result.message);
      } else {
        showToast("error", result.message);
      }
    } catch (error) {
      showToast("error", "Failed to unfollow user");
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(RouteProfileView(userId));
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Unable to load following list right now.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Following</h1>
        <p className="text-gray-600 mt-2">
          {followingList.length} {followingList.length === 1 ? "person" : "people"} you're following
        </p>
      </div>

      {followingList.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <UserMinus className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">You're not following anyone yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Discover authors and start following them to see their content
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {followingList.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => handleProfileClick(user._id)}
                >
                  <Avatar className="h-16 w-16 border-2 border-gray-200">
                    <AvatarImage src={user.avatar} alt={user.name} />
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {user.name}
                    </h3>
                    {user.email && (
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleUnfollow(user._id)}
                  disabled={unfollowingId === user._id}
                  className="ml-4"
                >
                  {unfollowingId === user._id ? "Unfollowing..." : "Unfollow"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Following;
