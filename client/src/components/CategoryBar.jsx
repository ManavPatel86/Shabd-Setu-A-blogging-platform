import React from "react";
import { ChevronRight } from "lucide-react";

export default function CategoryBar({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const scrollContainerRef = React.useRef(null);

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 240, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/70 shadow-sm px-4 md:px-6 py-2.5">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide pr-14"
        >
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
        <div className="pointer-events-none absolute inset-y-0 right-10 hidden w-12 bg-linear-to-l from-[#f5f1ff] via-white/60 to-transparent md:block" />
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll categories"
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] px-3 py-2 text-white shadow-[0_18px_35px_-18px_rgba(108,92,231,0.9)] transition hover:brightness-110"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
