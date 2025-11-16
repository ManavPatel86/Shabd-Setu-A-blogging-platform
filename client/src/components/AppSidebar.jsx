import { useMemo } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/images/logo-white.svg";
import { IoHomeOutline } from "react-icons/io5";
import { BiCategoryAlt } from "react-icons/bi";
import { GrBlog } from "react-icons/gr";
import { FaRegComments } from "react-icons/fa6";
import { LuUsers } from "react-icons/lu";
import { RouteHelp } from "@/helpers/RouteName";
import { FaQuestionCircle } from "react-icons/fa";
import {
    RouteIndex,
    RouteFollowing,
    RouteSaved,
    RouteCategoryFeed,
    RouteCategoryDetails,
    RouteBlog,
    RouteCommentDetails,
    RouteUser,
    RouteAdminReports,
} from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSelector } from "react-redux";
import { Bookmark, Flag } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { getEnv } from "@/helpers/getEnv";

function AppSidebar({ className }) {
    const isMobile = useIsMobile();
    const user = useSelector((state) => state.user);
    const location = useLocation();

    const baseUrl = getEnv("VITE_API_BASE_URL");
    const categoryUrl = baseUrl ? `${baseUrl}/category/all-category` : null;
    const { data: categoryData, loading: categoriesLoading } = useFetch(
        categoryUrl,
        { method: "get", credentials: "include" },
        [categoryUrl]
    );

    const categories = useMemo(() => {
        if (!Array.isArray(categoryData?.category)) {
            return [];
        }
        return categoryData.category.filter(Boolean);
    }, [categoryData]);

    return (
        <Sidebar
            className={`bg-white h-full border-r border-gray-200 ${className || ""}`}
            collapsible={isMobile ? "offcanvas" : "none"}
        >
            <SidebarHeader className="bg-white">
                {!isMobile && (
                    <div className="p-4">
                        <img src={logo} width={120} alt="ShabdSetu" />
                    </div>
                )}
                {isMobile && <div className="h-4" />}
            </SidebarHeader>

            <SidebarContent className="bg-white">
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to={RouteIndex} className="flex items-center gap-2">
                                    <IoHomeOutline />
                                    Home
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {user && user.isLoggedIn
                            ? <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteBlog} className="flex items-center gap-2">
                                            <GrBlog />
                                            My Blogs
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteCommentDetails} className="flex items-center gap-2">
                                            <FaRegComments />
                                            Comments
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteSaved} className="flex items-center gap-2">
                                            <Bookmark className="h-4 w-4" />
                                            Saved
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteFollowing} className="flex items-center gap-2">
                                            <LuUsers />
                                            Following
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteHelp} className="flex items-center gap-2">
                                        <FaQuestionCircle />
                                        Help
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>




                            </>
                            :
                            <></>
                        }

                        {user && user.isLoggedIn && user.user.role === 'admin'
                            ? <>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteCategoryDetails} className="flex items-center gap-2">
                                            <BiCategoryAlt />
                                                Manage Categories
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteUser} className="flex items-center gap-2">
                                            <LuUsers />
                                                Manage Users
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link to={RouteAdminReports} className="flex items-center gap-2">
                                            <Flag />
                                                Manage Reports
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </>
                            :
                            <></>
                        }

                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2 font-semibold text-black-600 text-md">
                        Popular Categories
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {categoriesLoading ? (
                            <SidebarMenuItem>
                                <div className="text-sm text-gray-400 px-2 py-2">
                                    Loading categories...
                                </div>
                            </SidebarMenuItem>
                        ) : categories.length > 0 ? (
                            categories.map((category) => {
                                const path = category?.slug ? RouteCategoryFeed(category.slug) : null;
                                if (!path) {
                                    return null;
                                }
                                const isActive = location.pathname === path;
                                return (
                                    <SidebarMenuItem key={category._id || category.slug}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                to={path}
                                                className={`flex items-center gap-2 ${isActive ? "text-blue-600 font-semibold" : ""}`}
                                            >
                                                {category.name}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })
                        ) : (
                            <SidebarMenuItem>
                                <div className="text-sm text-gray-400 px-2 py-2">
                                    No categories available
                                </div>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

export default AppSidebar;