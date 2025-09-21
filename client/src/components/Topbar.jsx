import React from "react";
import logo from "@/assets/images/logo-white.svg";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { MdLogin } from "react-icons/md";
import SearchBox from "./SearchBox";
import { RouteIndex, RouteSignIn } from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";


const Topbar = () => {
    const isMobile = useIsMobile();

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
                <Button
                    asChild
                    className="rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-sm px-3 py-2 md:px-4 md:py-2"
                >
                    <Link to={RouteSignIn} className="flex items-center gap-1 md:gap-2">
                        <MdLogin className="text-base md:text-lg" />
                        <span className="hidden sm:inline">Sign In</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
};

export default Topbar;
