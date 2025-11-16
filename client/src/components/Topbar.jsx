import React, { useEffect, useState } from 'react'
import logo from "@/assets/images/logo-white.svg";
import NotificationBell from './Notifications/NotificationBell.jsx';
import { Button } from "./ui/button";
import { Link, useNavigate } from 'react-router-dom'
import { MdLogin } from "react-icons/md";
import SearchBox from "./SearchBox";
import { RouteBlogAdd, RouteFollowers, RouteFollowing, RouteIndex, RouteProfile, RouteSignIn } from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import usericon from '@/assets/images/user.png'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FaRegUser } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { Users, UserPlus, Moon, Sun, PenTool } from "lucide-react";
import { removeUser } from '@/redux/user/user.slice';
import { showToast } from '@/helpers/showToast';
import { getEnv } from '@/helpers/getEnv';

export const TOPBAR_HEIGHT_PX = 88;

const Topbar = () => {
    const isMobile = useIsMobile();
    const [darkMode, setDarkMode] = useState(false);

    const dispath = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.user)
    const loggedInUser = user?.user

    const [menuOpen, setMenuOpen] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    const [followersError, setFollowersError] = useState('')

    const avatarSrc = loggedInUser?.avatar || usericon
    const displayName = loggedInUser?.name || 'User'
    const displayEmail = loggedInUser?.email || ''
    const initials = displayName?.charAt(0)?.toUpperCase() || 'U'
    const roleLabel = loggedInUser?.role === 'admin' ? 'Admin' : 'Member'

    useEffect(() => {
        if (!menuOpen || !loggedInUser?._id) {
            return
        }

        const controller = new AbortController()

        const fetchFollowersCount = async () => {
            try {
                setFollowersError('')
                const response = await fetch(
                    `${getEnv('VITE_API_BASE_URL')}/follow/followers/${loggedInUser._id}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        signal: controller.signal,
                    }
                )

                const data = await response.json().catch(() => ({}))

                if (!response.ok) {
                    throw new Error(data?.message || 'Failed to fetch followers')
                }

                const count = Array.isArray(data?.followers) ? data.followers.length : 0
                setFollowerCount(count)
            } catch (error) {
                if (error.name === 'AbortError') return
                setFollowersError(error.message || 'Failed to fetch followers')
                setFollowerCount(0)
            }
        }

        fetchFollowersCount()

        return () => controller.abort()
    }, [menuOpen, loggedInUser?._id])

    const handleLogout = async () => {
        try {
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/auth/logout`, {
                method: 'get',
                credentials: 'include',
            })
            const data = await response.json()
            if (!response.ok) {
                return showToast('error', data.message)
            }
            dispath(removeUser())
            navigate(RouteIndex)
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        }
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-[88px] bg-white/80 backdrop-blur-xl border-b border-gray-100/80 z-40">
            <div className="flex h-full items-center gap-4 px-4 sm:px-6 lg:px-10">
                <div className="flex items-center gap-4 min-w-fit">
                    <div className="lg:hidden">
                        <SidebarTrigger className="p-2.5 rounded-2xl bg-white shadow-sm text-gray-600 hover:bg-gray-50" />
                    </div>

                    <Link to={RouteIndex} className="flex items-center gap-3 min-w-fit">
                        <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
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
                        <div className="hidden md:flex flex-col">
                            <span className="text-2xl font-bold text-gray-900 leading-tight">ShabdSetu</span>
                            <span className="text-xs text-gray-500 tracking-wide">Blogging platform</span>
                        </div>
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 justify-center">
                    <div className="w-full max-w-xl">
                        <SearchBox />
                    </div>
                </div>

                <div className="flex items-center gap-4 min-w-fit">
                    <button
                        onClick={toggleDarkMode}
                        className="p-3 text-gray-500 hover:text-[#6C5CE7] bg-white rounded-full shadow-sm hover:shadow-md transition-all hidden sm:block"
                        aria-label="Toggle theme"
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {user.isLoggedIn && (
                        <div className="shrink-0">
                            <NotificationBell />
                        </div>
                    )}

                    {user.isLoggedIn && (
                        <Button
                            asChild
                            className="hidden sm:inline-flex items-center gap-2 bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] hover:from-[#6C5CE7] hover:to-[#6C5CE7] text-white px-6 py-3 rounded-full text-xs font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                        >
                            <Link to={RouteBlogAdd}>
                                <PenTool className="h-4 w-4" />
                                Write
                            </Link>
                        </Button>
                    )}

                    {!user.isLoggedIn ? (
                        <Button
                            asChild
                            className="inline-flex items-center gap-2 bg-linear-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-full text-xs font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            <Link to={RouteSignIn}>
                                <MdLogin className="text-base" />
                                <span className="hidden sm:inline">Sign In</span>
                            </Link>
                        </Button>
                    ) : (
                        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                            <DropdownMenuTrigger className="focus:outline-none">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                    <AvatarImage src={avatarSrc} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl">
                                <div className="flex items-center gap-3 bg-linear-to-r from-blue-600 to-indigo-500 px-5 py-6 text-white">
                                    <Avatar className="h-12 w-12 border-2 border-white/80 shadow-md">
                                        <AvatarImage src={avatarSrc} />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{displayName}</p>
                                        <p className="truncate text-xs text-white/80">{displayEmail}</p>
                                        <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide">
                                            <span className="rounded-full border border-white/50 px-2 py-0.5 font-semibold text-white/90">{roleLabel}</span>
                                            <span className="rounded-full border border-white/40 px-2 py-0.5 font-semibold text-white/80 flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {followerCount} follower{followerCount === 1 ? '' : 's'}
                                                {followersError && <span className="sr-only">{followersError}</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-3 space-y-1">
                                    <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                    >
                                        <Link to={RouteProfile} className="flex items-center gap-2">
                                            <FaRegUser className="text-slate-500" />
                                            View Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                    >
                                        <Link to={RouteFollowing} className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-slate-500" />
                                            Following
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        asChild
                                        className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                    >
                                        <Link to={RouteFollowers} className="flex items-center gap-2">
                                            <UserPlus className="h-4 w-4 text-slate-500" />
                                            Followers
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="sm:hidden rounded-lg bg-gray-900 text-white px-3 py-2 text-sm font-semibold hover:bg-black">
                                        <Link to={RouteBlogAdd} className="flex items-center gap-2">
                                            <PenTool className="h-4 w-4" />
                                            Write a Blog
                                        </Link>
                                    </DropdownMenuItem>
                                </div>

                                <DropdownMenuSeparator className="my-0" />

                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <IoLogOutOutline className="text-base" />
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
