import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import Loading from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RouteProfileView } from "@/helpers/RouteName";
import { UserPlus } from "lucide-react";

const Followers = () => {
  const currentUser = useSelector((state) => state.user?.user);
  const navigate = useNavigate();

  const { data, loading, error } = useFetch(
    currentUser?._id
      ? `${getEnv("VITE_API_BASE_URL")}/follow/followers/${currentUser._id}`
      : null,
    {
      method: "get",
      credentials: "include",
    },
    [currentUser?._id]
  );

  if (!currentUser?._id) {
    return (
      <div className="text-center py-10 text-gray-500">
        Please sign in to view followers.
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        Unable to load followers right now.
      </div>
    );
  }

  const followers = Array.isArray(data?.followers) ? data.followers : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Followers</h1>
        <p className="text-gray-600 mt-2">
          {followers.length} {followers.length === 1 ? "person" : "people"} following you
        </p>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">No followers yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Share your posts to grow your audience and attract followers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {followers.map((follower) => (
            <div
              key={follower._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => follower?._id && navigate(RouteProfileView(follower._id))}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={follower?.avatar} alt={follower?.name} />
                  <AvatarFallback>
                    {follower?.name ? follower.name.charAt(0).toUpperCase() : "F"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {follower?.name || "Unknown"}
                  </h3>
                  {follower?.email && (
                    <p className="text-sm text-gray-500 truncate">{follower.email}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Followers;
