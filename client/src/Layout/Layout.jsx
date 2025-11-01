import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

// Removed:
// import blogs from "@/Layout/Data/blog";
// import Latest_Blogs from "@/components/Latest_Blogs";


const Layout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Removed:
  // const showLatestBlogs = location.pathname === '/';

  return (
    <SidebarProvider>
      {/* Top Navigation */}
      <Topbar />

      {/* Main Layout with Sidebar */}
      {/* This layout creates the sticky sidebar and scrolling content area */}
      <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
        <AppSidebar className={`h-full ${isMobile ? "md:flex" : "flex"}`} />

        {/* This main content area is now scrollable on its own */}
        <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto">
          <div className="flex-1 py-6 px-4 pb-24 sm:py-8 sm:px-6 md:py-12 md:px-8 lg:py-16 lg:px-10">
            {/* Render matched route */}
            <Outlet />

            {/* Removed: The duplicate <Latest_Blogs /> component was here */}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;

