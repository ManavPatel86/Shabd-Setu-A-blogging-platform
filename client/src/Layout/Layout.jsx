import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";
import { Outlet } from "react-router-dom";
import { BlogCard } from "@/components/BlogCard";
import { formatDate } from "../utils/functions";
import { RouteIndex } from "@/helpers/RouteName";

const dummyBlogPosts = [
  {
    title: 'React Tailwind Newsletter Component',
    slug: RouteIndex, // Replace with a real slug
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
  {
    title: 'React Tailwind Newsletter Component',
   slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
  {
    title: 'React Tailwind Newsletter Component',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: RouteIndex,
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
];

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <Topbar />
      
      {/* Flex container for sidebar + main */}
      <div className="flex w-full min-h-[calc(100vh-64px)] overflow-x-hidden">
        {/* Sidebar - Hidden on mobile by default, shown when triggered */}
        <AppSidebar className={`h-full ${isMobile ? 'md:flex' : 'flex'}`} />

        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-x-hidden">
          {/* Body content with responsive padding */}
          <div className="flex-1 py-6 px-4 pb-24 sm:py-8 sm:px-6 md:py-12 md:px-8 lg:py-16 lg:px-10">
            {/* The Outlet will render the component for the current route */}
            <Outlet />

            {/* Display multiple blog cards with responsive grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {dummyBlogPosts.map((post, index) => (
                <BlogCard key={index} {...post} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Footer - Responsive positioning */}
      <div className={`fixed bottom-0 right-0 border-t border-gray-200 bg-gray-50 ${
        isMobile 
          ? 'left-0' 
          : 'left-[var(--sidebar-width,0px)]'
      }`}>
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default Layout;