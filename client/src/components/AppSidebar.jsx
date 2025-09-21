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
import { GoDot } from "react-icons/go";
import { RouteIndex } from "@/helpers/RouteName";
import { useIsMobile } from "@/hooks/use-mobile";

function AppSidebar({ className }) {
    const isMobile = useIsMobile();

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

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to="" className="flex items-center gap-2">
                                    <BiCategoryAlt />
                                    Categories
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to="" className="flex items-center gap-2">
                                    <GrBlog />
                                    Blogs
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to="" className="flex items-center gap-2">
                                    <FaRegComments />
                                    Comments
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to="" className="flex items-center gap-2">
                                    <LuUsers />
                                    Users
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                
                <SidebarGroup>
                    <SidebarGroupLabel>Categories</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link to="" className="flex items-center gap-2">
                                    <GoDot />
                                    Category Item
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}

export default AppSidebar;