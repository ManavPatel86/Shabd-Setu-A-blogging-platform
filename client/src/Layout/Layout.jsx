import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { Outlet } from "react-router-dom";
import { BlogCard } from "@/components/BlogCard";
import { formatDate } from "../utils/functions";

const dummyBlogPosts = [
  {
    title: 'React Tailwind Newsletter Component',
    slug: '#', // Replace with a real slug
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
  {
    title: 'React Tailwind Newsletter Component',
    slug: '#', // Replace with a real slug
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
  {
    title: 'React Tailwind Newsletter Component',
    slug: '#', // Replace with a real slug
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-07-14',
    category: 'React',
  },
  {
    title: 'Mastering Layouts in React',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-08-01',
    category: 'Layout',
  },
  {
    title: 'Building a Flexible Sidebar',
    slug: '#',
    cover: 'https://plus.unsplash.com/premium_photo-1673984261110-d1d931e062c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    publishDate: '2024-06-25',
    category: 'UI/UX',
  },
];

const Layout = () => {
  return (
    <SidebarProvider>
      <Topbar />
      <div className="flex w-full min-h-[calc(100vh-45px)] overflow-x-hidden">
        <AppSidebar className="h-full" />
        <main className="flex-1 flex flex-col overflow-x-hidden">
          <div className="flex-1 py-28 px-10 pb-24">
            {/* The Outlet will render the component for the current route */}
            <Outlet />

            {/* Display multiple blog cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dummyBlogPosts.map((post, index) => (
                <BlogCard key={index} {...post} />
              ))}
            </div>
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-[var(--sidebar-width,0px)] right-0 border-t border-gray-200 bg-gray-50">
        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
