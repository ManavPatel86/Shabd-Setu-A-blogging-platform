import React from "react";


// ✅ Fixed import path
import filters from "@/Layout/Data/filters";
import ArticleCard from "@/components/ArticleCard";

const Latest_Blogs = ({ blogs = [] }) => {
  const [menu, setMenu] = React.useState("All");

  const filteredBlogs = blogs.filter((blog) =>
    menu === "All" ? true : blog.filter === menu
  );

  return (
    <div className="lg:col-span-2 space-y-4 mt-7">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-3xl font-bold">Latest Blogs</h2>
        <span className="text-sm text-gray-500">
          {filteredBlogs.length} articles
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white p-2">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setMenu(item)}
              className={`px-3 py-1.5 rounded-full text-lg font-semibold whitespace-nowrap transition-colors ${
                menu === item
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards */}
      <div className="space-y-6">
        {filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog) => (
            <ArticleCard key={blog.id} blog={blog} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No blogs found for "{menu}" category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Latest_Blogs;
