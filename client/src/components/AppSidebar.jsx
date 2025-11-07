import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import logo from "@/assets/images/logo-white.svg";
import { IoHomeOutline } from "react-icons/io5";
import { BiCategoryAlt } from "react-icons/bi";
import { GrBlog } from "react-icons/gr";
import { FaRegComments } from "react-icons/fa6";
import { LuUsers } from "react-icons/lu";
import {
    RouteIndex,
    RouteFollowing,
    RouteSaved,
    RouteCategoryDetails,
    RouteEditCategory,
    RouteBlog,
    RouteCommentDetails,
    RouteUser
} from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSelector } from "react-redux";
import { Bookmark } from "lucide-react";

function AppSidebar({ className }) {
    const isMobile = useIsMobile();
    const user = useSelector((state) => state.user); // <-- Add this line
    // Example categories array, replace with your actual categories data
    const categories = [
        { id: 1, name: "🖥️ Technology" },
        { id: 2, name: "💪 Health & Fitness" },
        { id: 3, name: "🌍 Travel" },
        { id: 4, name: "🎓 Education & Career" },
        { id: 5, name: "🏃🏻 Sports" },
        { id: 6, name: "🍳 Food & Recipes" },
        { id: 7, name: "🎨 Art & Design" },
        { id: 8, name: "🎤 Music & Entertainment" },
        { id: 9, name: "🎬 Movies & TV" },
        { id: 10, name: "🏠 Lifestyle" },
        { id: 11, name: "💰 Finance & Investing" },
        { id: 12, name: "🎥 Photography & Videography" },
        { id: 13, name: "💼 Business & Entrepreneurship" },
        { id: 14, name: "🕹️ Gaming & Esports" },
        { id: 15, name: "🧘 Self-Improvement" },
        { id: 16, name: "🛠️ DIY & Home Improvement" },
        { id: 17, name: "📰 News & Current Affairs" },
        { id: 18, name: "🎙️ Social Media & Marketing" },
        { id: 19, name: "🎧 Audiobooks & Podcasts" },
        { id: 20, name: "🧴 Beauty & Fashion" },
        { id: 21, name: "🐾 Pets & Animals" },
        { id: 22, name: "🌐 Science" },
        { id: 23, name: "🔍 History & Culture" },
    ];

    return (
        <Sidebar 
            className={`bg-white h-full border-r border-gray-200 ${className || ''}`}
            collapsible={isMobile ? "offcanvas" : "none"}
        >
            <SidebarHeader className="bg-white">
                {/* Show logo only on desktop, mobile has it in topbar */}
                {!isMobile && (
                    <div className="p-4">
                        <img src={logo} width={120} alt="ShabdSetu" />
                    </div>
                )}
                {isMobile && <div className="h-4"></div>}
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
                        {categories.map(category => (
                            <SidebarMenuItem key={category.id}>
                                <SidebarMenuButton asChild>
                                    <Link to="" className="flex items-center gap-2">
                                        {category.name}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

export default AppSidebar;