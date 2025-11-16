import React from "react";

export default function CategoryBar({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  return (
    <div className="sticky top-[0px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/70 shadow-sm px-4 md:px-6 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCategory(cat.name)}
            className={`
              group relative flex items-center gap-2.5 px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all duration-200
              ${
                activeCategory === cat.name
                  ? "bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-white shadow-md shadow-indigo-200"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-indigo-100 hover:text-[#6C5CE7]"
              }
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
