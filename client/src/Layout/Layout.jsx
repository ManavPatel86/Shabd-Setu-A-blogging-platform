import React from "react";
import { Outlet } from "react-router-dom";

import AppSidebar from "@/components/AppSidebar";
import Topbar, { TOPBAR_HEIGHT_PX } from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Layout = () => {
  const topOffset = TOPBAR_HEIGHT_PX || 88;

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-[#F5F6FA] text-gray-600 overflow-x-hidden selection:bg-[#6C5CE7] selection:text-white">
        <Topbar />
        <AppSidebar />

        <main className="pt-[88px] lg:ml-72">
          <div className="min-h-[calc(100vh-88px)] pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Layout;

