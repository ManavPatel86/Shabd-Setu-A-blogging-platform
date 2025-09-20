import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <SidebarProvider>
            <Topbar />

            {/* Flex container for sidebar + main */}
            <div className="flex w-full min-h-[calc(100vh-45px)] overflow-x-hidden">
                {/* Sidebar */}
                <AppSidebar className="h-full" />

                {/* Main content area */}
                <main className="flex-1 flex flex-col overflow-x-hidden">
                    {/* Body content with bottom padding so it doesn't overlap footer */}
                    <div className="flex-1 py-28 px-10 pb-24">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Fixed footer, always visible at the bottom */}
            <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 border-t border-gray-200 bg-gray-50">
                <Footer />
            </div>
        </SidebarProvider>
    );
};

export default Layout;
