import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    Bookmark,
    Briefcase,
    Users,
    Settings,
    LogOut,
    HelpCircle,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";
import {
    RouteIndex,
    RouteBlog,
    RouteCommentDetails,
    RouteSaved,
    RouteFollowing,
    RouteCategoryDetails,
    RouteUser,
    RouteCategoryFeed,
    RouteHelp,
} from "@/helpers/RouteName";
import { removeUser } from "@/redux/user/user.slice";
import { showToast } from "@/helpers/showToast";
import { TOPBAR_HEIGHT_PX } from "./Topbar";

const SidebarItem = ({ icon: Icon, label, to, active, badge }) => (
    <Link
        to={to}
        className={`relative flex items-center justify-between px-8 py-3.5 cursor-pointer transition-all duration-300 group ${
            active ? "bg-gray-50" : "hover:bg-gray-50"
        }`}
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
            <span className={`text-[15px] ${active ? "font-bold" : "font-medium"}`}>
                {label}
            </span>
        </div>
        {badge && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {badge}
            </span>
        )}
    </Link>
);

const SidebarCategory = ({ emoji, name, to }) => (
    <Link
        to={to}
        className="flex items-center gap-4 px-8 py-3 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg group-hover:bg-[#6C5CE7]/10">
            {emoji}
        </div>
        <div>
            <h5 className="text-[15px] font-semibold text-gray-800 group-hover:text-[#6C5CE7] transition-colors">
                {name}
            </h5>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Category</p>
        </div>
    </Link>
);

const AppSidebar = () => {
    const userState = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const location = useLocation();

    const baseUrl = getEnv("VITE_API_BASE_URL");
    const categoryUrl = baseUrl ? `${baseUrl}/category/all-category` : null;
    const { data: categoryData, loading: categoriesLoading } = useFetch(
        categoryUrl,
        { method: "get", credentials: "include" },
        [categoryUrl]
    );

    const categories = useMemo(() => {
        if (!Array.isArray(categoryData?.category)) return [];
        return categoryData.category.filter(Boolean).slice(0, 6);
    }, [categoryData]);

    const handleLogout = async () => {
        try {
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/auth/logout`, {
                method: 'get',
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                return showToast('error', data.message);
            }
            dispatch(removeUser());
            showToast('success', data.message);
        } catch (error) {
            showToast('error', error.message);
        }
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", to: RouteIndex },
        { icon: FileText, label: "My Blogs", to: RouteBlog, auth: true },
        { icon: MessageSquare, label: "Comments", to: RouteCommentDetails, auth: true },
        { icon: Bookmark, label: "Saved", to: RouteSaved, auth: true },
        { icon: Users, label: "Following", to: RouteFollowing, auth: true },
        { icon: Briefcase, label: "Manage Categories", to: RouteCategoryDetails, admin: true },
        { icon: Users, label: "Manage Users", to: RouteUser, admin: true },
    ];

    const topOffset = TOPBAR_HEIGHT_PX || 88;

    return (
        <aside
            className={`fixed left-0 bottom-0 w-72 bg-white border-r border-gray-100 z-30 overflow-y-auto no-scrollbar transition-transform duration-300 ease-in-out ${
                ''
            }`}
            style={{ top: `${topOffset}px` }}
        >
            <div className="py-6">
                <h3 className="px-8 mt-2 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Overview
                </h3>
                <nav className="space-y-1.5">
                    {navItems.map(({ icon, label, to, auth, admin }) => {
                        if (auth && !userState?.isLoggedIn) return null;
                        if (admin && userState?.user?.role !== 'admin') return null;
                        const isActive = location.pathname === to;
                        return (
                            <SidebarItem
                                key={label}
                                icon={icon}
                                label={label}
                                to={to}
                                active={isActive}
                            />
                        );
                    })}
                </nav>

                <h3 className="px-8 mt-10 mb-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Popular Categories
                </h3>
                <div className="space-y-1.5">
                    {categoriesLoading && (
                        <p className="px-8 text-sm text-gray-400">Loading...</p>
                    )}
                    {!categoriesLoading && categories.length === 0 && (
                        <p className="px-8 text-sm text-gray-400">No categories available.</p>
                    )}
                    {categories.map((category) => {
                        const path = category?.slug ? RouteCategoryFeed(category.slug) : null;
                        if (!path) return null;
                        const emojiMatch = category.name.match(/^\p{Extended_Pictographic}+\s?/u);
                        const emoji = emojiMatch ? emojiMatch[0].trim() : '📁';
                        const nameWithoutEmoji = emojiMatch
                            ? category.name.replace(emojiMatch[0], '').trim()
                            : category.name;
                        return (
                            <SidebarCategory
                                key={category._id || category.slug}
                                emoji={emoji}
                                name={nameWithoutEmoji}
                                to={path}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="p-6 border-t border-gray-50">
                <SidebarItem icon={Settings} label="Help Center" to={RouteHelp} active={location.pathname === RouteHelp} />
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