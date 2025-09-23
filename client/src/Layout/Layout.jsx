import React from "react";
import { Outlet } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";


import blogs from "@/Layout/Data/blog";
import Latest_Blogs from "@/components/Latest_Blogs";


const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      {/* Top Navigation */}
      <Topbar />

      {/* Main Layout with Sidebar */}
      <div className="flex w-full min-h-[calc(100vh-64px)] overflow-x-hidden">
        <AppSidebar className={`h-full ${isMobile ? "md:flex" : "flex"}`} />

        <main className="flex-1 flex flex-col overflow-x-hidden">
          <div className="flex-1 py-6 px-4 pb-24 sm:py-8 sm:px-6 md:py-12 md:px-8 lg:py-16 lg:px-10">
            {/* Render matched route */}
            <Outlet />

            {/* ✅ Latest Blogs Section */}
            <Latest_Blogs blogs={blogs}  />
          </div>
        </main>
      </div>

      {/* Footer */}
      <div
        className={`fixed bottom-0 right-0 border-t border-gray-200 bg-gray-50 ${
          isMobile ? "left-0" : "left-[var(--sidebar-width,0px)]"
        }`}
      >
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
