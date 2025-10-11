import React, { useState } from 'react'
import logo from "@/assets/images/logo-white.svg";
import { Button } from "./ui/button";
import { Link, useNavigate } from 'react-router-dom'
import { MdLogin } from "react-icons/md";
import SearchBox from "./SearchBox";
import { RouteIndex, RouteProfile, RouteSignIn } from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";
import usericon from '@/assets/images/user.png'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FaRegUser } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { IoLogOutOutline, IoSearch } from "react-icons/io5";
import { removeUser } from '@/redux/user/user.slice';
import { showToast } from '@/helpers/showToast';
import { getEnv } from '@/helpers/getEnv';

const Topbar = () => {
    const isMobile = useIsMobile();

    const dispath = useDispatch()
    const navigate = useNavigate()
    const user = useSelector((state) => state.user) 

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
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar className={"w-8 h-8 cursor-pointer"}>
                                <AvatarImage src={usericon} />
                            </Avatar>

                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>
                                <p>{user.user.name}</p>
                                <p className='text-sm'>{user.user.email}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={RouteProfile}>
                                    <FaRegUser />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link to={RouteIndex}>
                                    <FaPlus />
                                    Create Blog
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
