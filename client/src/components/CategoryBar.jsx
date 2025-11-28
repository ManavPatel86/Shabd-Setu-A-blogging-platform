import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TOPBAR_HEIGHT_PX } from "./Topbar";

export default function CategoryBar({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollRight(maxScrollLeft - el.scrollLeft > 1);
  };

  const handleScrollLeft = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: -240, behavior: "smooth" });
    window.requestAnimationFrame(updateScrollState);
  };

  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: 240, behavior: "smooth" });
    window.requestAnimationFrame(updateScrollState);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [categories]);

  const stickyOffset = useMemo(() => (TOPBAR_HEIGHT_PX || 88) + 8, []);

  return (
    <div
      className="sticky z-30 bg-[#F5F6FA]/95 backdrop-blur-md border-b border-white/70 shadow-[0_15px_40px_-32px_rgba(15,23,42,0.5)] px-4 sm:px-8 lg:px-12 py-3"
      style={{ top: stickyOffset }}
    >
      <div className="relative mx-auto max-w-[1400px]">
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll categories left"
          disabled={!canScrollLeft}
          className="absolute items-center justify-center hidden text-gray-500 transition -translate-y-1/2 bg-white border border-gray-200 rounded-full shadow-sm left-3 top-1/2 h-9 w-9 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 md:flex md:z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide px-2 sm:px-4 lg:px-8"
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat.name)}
              className={`
                group relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-all duration-200
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
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll categories right"
          disabled={!canScrollRight}
          className="absolute items-center justify-center hidden text-gray-500 transition -translate-y-1/2 bg-white border border-gray-200 rounded-full shadow-sm right-3 top-1/2 h-9 w-9 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 md:flex md:z-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
