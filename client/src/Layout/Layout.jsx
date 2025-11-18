import React from "react";
import { Outlet } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import Topbar, { TOPBAR_HEIGHT_PX } from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Layout = () => {
  const topOffset = TOPBAR_HEIGHT_PX || 88;

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-[#F5F6FA] text-gray-600 overflow-hidden selection:bg-[#6C5CE7] selection:text-white">
        <Topbar />
        <AppSidebar />

        <main className="ml-0 lg:ml-72 pt-[88px]">
          <div
            className="h-[calc(100vh-88px)] overflow-y-auto overflow-x-hidden scrollbar-hide"
            style={{ height: `calc(100vh - ${topOffset}px)` }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;

