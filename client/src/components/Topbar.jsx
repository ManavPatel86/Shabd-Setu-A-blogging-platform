import React, { useEffect, useState } from 'react'
import logo from "@/assets/images/logo-white.svg";
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
import { FaPlus } from "react-icons/fa6";
import { IoLogOutOutline } from "react-icons/io5";
import { Users, UserPlus } from "lucide-react";
import { removeUser } from '@/redux/user/user.slice';
import { showToast } from '@/helpers/showToast';
import { getEnv } from '@/helpers/getEnv';

const Topbar = () => {
    const isMobile = useIsMobile();

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

    return (
        <div className="fixed top-0 left-0 w-full z-20 flex justify-between items-center bg-white px-4 md:px-12 h-16 border-b">
            {/* Logo and Sidebar Trigger */}
            <div className="flex items-center gap-3">
                {/* Mobile sidebar trigger - only show on mobile */}
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>

                <Link to={RouteIndex}>
                    <img
                        src={logo}
                        className="w-32 sm:w-40 md:w-48"
                        alt="Logo"
                    />
                </Link>
            </div>

            {/* Search Box - Hidden on mobile, shown on tablet+ */}
            <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4">
                <SearchBox />

            </div>

            {/* Sign In Button */}
            <div className="flex items-center gap-2">
                {!user.isLoggedIn ?
                    <Button
                    asChild
                    className="rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm px-3 py-2 md:px-4 md:py-2"
                >
                    <Link to={RouteSignIn} className="flex items-center gap-1 md:gap-2">
                        <MdLogin className="text-base md:text-lg" />
                        <span className="hidden sm:inline">Sign In</span>
                    </Link>
                </Button>
                    :
                    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                        <DropdownMenuTrigger>
                            <Avatar className="h-9 w-9 cursor-pointer border-2 border-blue-100 shadow-sm">
                                <AvatarImage src={avatarSrc} />
                                <AvatarFallback>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>

                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 overflow-hidden rounded-xl border border-slate-200 p-0 shadow-xl">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-5 text-white">
                                <Avatar className="h-12 w-12 border-2 border-white/70 shadow-md">
                                    <AvatarImage src={avatarSrc} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{displayName}</p>
                                    <p className="truncate text-xs text-white/75">{displayEmail}</p>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wide">
                                        <span className="rounded-full border border-white/40 px-2 py-0.5 font-semibold text-white/90">{roleLabel}</span>
                                        <span className="rounded-full border border-white/30 px-2 py-0.5 font-semibold text-white/80 flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {followerCount} follower{followerCount === 1 ? '' : 's'}
                                            {followersError && <span className="sr-only">{followersError}</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-4 py-3">
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
                                <DropdownMenuItem asChild className="p-0">
                                    <Link
                                        to={RouteBlogAdd}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:bg-blue-700"
                                    >
                                        <FaPlus className="text-white" />
                                        Write a Blog
                                    </Link>
                                </DropdownMenuItem>
                            </div>

                            <DropdownMenuSeparator className="my-0" />

                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                            >
                                <IoLogOutOutline color='red' />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            </div>
        </div>
    );
};

export default Topbar;
