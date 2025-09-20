import React from "react";
import logo from "@/assets/images/logo-white.svg";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { MdLogin } from "react-icons/md";
import SearchBox from "./SearchBox";
import { RouteIndex, RouteSignIn } from "@/helpers/RouteName";

const Topbar = () => {
    return (
        <div className="fixed top-0 left-0 w-full z-20 flex justify-between items-center bg-white px-4 h-16 border-b">
            {/* Logo and Branding */}
            <div className="flex items-center ml-0">
                <Link to={RouteIndex} className="flex items-center">
                    <img src={logo} className="w-42" alt="Logo" />
                </Link>
            </div>
            <div className="w-[500px]">
                <SearchBox />
            </div>

            {/* Sign In Button */}
            <div className="flex items-center gap-5">
                <Button asChild className="rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white">
                    <Link to={RouteSignIn} className="flex items-center gap-2">
                        <MdLogin />
                        <span>Sign In</span>
                    </Link>
                    
                </Button>
            </div>
        </div>
    );
};

export default Topbar;
