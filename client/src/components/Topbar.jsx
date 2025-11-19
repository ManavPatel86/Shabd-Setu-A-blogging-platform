// Topbar.jsx — streamlined responsive top bar
import React, { useEffect, useState } from "react";
import NotificationBell from "./Notifications/NotificationBell.jsx";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router-dom";
import { MdLogin } from "react-icons/md";
import SearchBox from "./SearchBox";
import {
  RouteBlogAdd,
  RouteFollowers,
  RouteFollowing,
  RouteIndex,
  RouteProfile,
  RouteSignIn,
} from "@/helpers/RouteName";
import { SidebarTrigger } from "@/components/ui/sidebar";
import usericon from "@/assets/images/user.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaRegUser } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { Users, UserPlus, PenTool } from "lucide-react";
import { removeUser } from "@/redux/user/user.slice";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";

export const TOPBAR_HEIGHT_PX = 88;

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.user);
  const loggedInUser = user?.user;

  const [menuOpen, setMenuOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const avatarSrc = loggedInUser?.avatar || usericon;
  const displayName = loggedInUser?.name || "User";
  const displayEmail = loggedInUser?.email || "";
  const initials = displayName?.charAt(0)?.toUpperCase() || "U";
  const roleLabel = loggedInUser?.role === "admin" ? "Admin" : "Member";

  useEffect(() => {
    if (!menuOpen || !loggedInUser?._id) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${getEnv("VITE_API_BASE_URL")}/follow/followers/${loggedInUser._id}`,
          { method: "GET", credentials: "include", signal: controller.signal }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.message || "Failed to fetch followers");

        const count = Array.isArray(data?.followers) ? data.followers.length : 0;
        setFollowerCount(count);
      } catch (error) {
        if (error.name !== "AbortError") {
          setFollowerCount(0);
        }
      }
    })();

    return () => controller.abort();
  }, [menuOpen, loggedInUser?._id]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${getEnv("VITE_API_BASE_URL")}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) return showToast("error", data.message);
      dispatch(removeUser());
      navigate(RouteIndex);
      showToast("success", data.message);
    } catch (e) {
      showToast("error", e.message);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[88px] border-b border-white/80 bg-white/90 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="flex items-center h-full gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4 min-w-fit">
          <div className="lg:hidden">
            <SidebarTrigger className="rounded-2xl border border-white/70 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-white" />
          </div>

          <Link to={RouteIndex} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-[#6C5CE7] to-[#8E7CF3] text-white shadow-lg shadow-indigo-200/80">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div className="flex-col hidden md:flex">
              <span className="text-xl font-semibold text-slate-900">ShabdSetu</span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Blogging</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center flex-1 gap-3">
          <div className="flex-1 md:hidden">
            <SearchBox />
          </div>
          <div className="justify-center flex-1 hidden md:flex">
            <div className="w-full max-w-xl">
              <SearchBox />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-fit">
          {user?.isLoggedIn && (
            <Button
              asChild
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-[#6C5CE7] hover:to-[#6C5CE7]"
            >
              <Link to={RouteBlogAdd}>
                <PenTool className="w-4 h-4" /> Write
              </Link>
            </Button>
          )}

          {user?.isLoggedIn && <NotificationBell />}

          {!user?.isLoggedIn ? (
            <Button
              asChild
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
            >
              <Link to={RouteSignIn}>
                <MdLogin className="text-sm" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </Button>
          ) : (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-2 ring-[#6C5CE7]/30">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="p-0 overflow-hidden border shadow-2xl w-80 rounded-2xl border-slate-200"
              >
                <div className="flex items-center gap-3 px-5 py-6 text-white bg-linear-to-r from-blue-600 to-indigo-500">
                  <Avatar className="w-12 h-12 border-2 shadow-md border-white/80">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <p className="text-xs truncate text-white/80">{displayEmail}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide">
                      <span className="rounded-full border border-white/50 px-2 py-0.5 font-semibold">
                        {roleLabel}
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-white/40 px-2 py-0.5 font-semibold">
                        <Users className="w-3 h-3" />
                        {followerCount} follower{followerCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 space-y-1">
                  <DropdownMenuItem
                    asChild
                    className="px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-600 hover:bg-slate-100"
                  >
                    <Link to={RouteProfile} className="flex items-center gap-2">
                      <FaRegUser className="text-slate-500" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-600 hover:bg-slate-100"
                  >
                    <Link to={RouteFollowing} className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      Following
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="px-3 py-2 text-sm rounded-lg cursor-pointer text-slate-600 hover:bg-slate-100"
                  >
                    <Link to={RouteFollowers} className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-slate-500" />
                      Followers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="sm:hidden rounded-lg bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:from-[#6C5CE7] hover:to-[#6C5CE7]"
                  >
                    <Link to={RouteBlogAdd} className="flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      Write a Blog
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-0" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 cursor-pointer hover:bg-red-50"
                >
                  <IoLogOutOutline />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
