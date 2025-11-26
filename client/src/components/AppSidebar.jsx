import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    Bookmark,
    Briefcase,
    Users,
    Flag,
    Settings,
    LogOut,
} from "lucide-react";

import { useSelector, useDispatch } from "react-redux";
import { getEnv } from "@/helpers/getEnv";
import {
    RouteIndex,
    RouteBlog,
    RouteCommentDetails,
    RouteSaved,
    RouteFollowing,
    RouteCategoryDetails,
    RouteAdminReports,
    RouteUser,
    RouteHelp,
} from "@/helpers/RouteName";
import { removeUser } from "@/redux/user/user.slice";
import { showToast } from "@/helpers/showToast";
import { TOPBAR_HEIGHT_PX } from "./Topbar";

/* ------------------------- Sidebar Item ------------------------- */
const SidebarItem = ({ icon: Icon, label, to, active }) => (
    <Link
        to={to}
        className={`relative flex items-center justify-between px-8 py-3.5 cursor-pointer transition-all duration-300 group 
            ${active ? "bg-gray-50" : "hover:bg-gray-50"}`}
    >
        {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#6C5CE7] rounded-r-md" />
        )}

        <div
            className={`flex items-center gap-5 ${
                active ? "text-[#6C5CE7]" : "text-gray-500 group-hover:text-gray-900"
            }`}
        >
            <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className="transition-transform group-hover:scale-110"
            />
            <span
                className={`text-[15px] ${active ? "font-bold" : "font-medium"}`}
            >
                {label}
            </span>
        </div>
    </Link>
);

/* ========================== MAIN SIDEBAR ========================== */
const AppSidebar = () => {
    const userState = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const location = useLocation();

    /* ----------------- LOGOUT ----------------- */
    const handleLogout = async () => {
        try {
            const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/auth/logout`, {
                method: "get",
                credentials: "include",
            });

            const data = await response.json();
            if (!response.ok) return showToast("error", data.message);

            dispatch(removeUser());
            showToast("success", data.message);
        } catch (error) {
            showToast("error", error.message);
        }
    };

    /* ----------------- Nav Items ----------------- */
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", to: RouteIndex },
        { icon: FileText, label: "My Blogs", to: RouteBlog, auth: true },
        { icon: MessageSquare, label: "Comments", to: RouteCommentDetails, auth: true },
        { icon: Bookmark, label: "Saved", to: RouteSaved, auth: true },
        { icon: Users, label: "Following", to: RouteFollowing, auth: true },
        { icon: Flag, label: "Reports", to: RouteAdminReports, admin: true },
        { icon: Briefcase, label: "Manage Categories", to: RouteCategoryDetails, admin: true },
        { icon: Users, label: "Manage Users", to: RouteUser, admin: true },
    ];

    const topOffset = TOPBAR_HEIGHT_PX || 88;

    return (
        <aside
            className="fixed left-0 bottom-0 w-72 bg-white border-r border-gray-100 z-30 overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out"
            style={{ top: `${topOffset}px` }}
        >
            <div className="py-6">
                {/* ------------ Overview Section ------------ */}
                <h3 className="px-8 mt-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Overview
                </h3>

                <nav className="space-y-1.5">
                    {navItems.map(({ icon, label, to, auth, admin }) => {
                        if (auth && !userState?.isLoggedIn) return null;
                        if (admin && userState?.user?.role !== "admin") return null;

                        const active = location.pathname === to;
                        return (
                            <SidebarItem
                                key={label}
                                icon={icon}
                                label={label}
                                to={to}
                                active={active}
                            />
                        );
                    })}
                </nav>

            </div>

            {/* ------------ Footer Items (Help + Logout) ------------ */}
            <div className="p-6 border-t border-gray-50">
                <SidebarItem
                    icon={Settings}
                    label="Help Center"
                    to={RouteHelp}
                    active={location.pathname === RouteHelp}
                />

                {userState?.isLoggedIn && (
                    <button
                        onClick={handleLogout}
                        className="mt-3 w-full px-8 py-3.5 flex items-center gap-4 text-gray-500 hover:text-red-500 cursor-pointer transition-all group"
                    >
                        <LogOut
                            size={22}
                            className="group-hover:-translate-x-1 transition-transform"
                        />
                        <span className="text-[15px] font-medium">Logout</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default AppSidebar;