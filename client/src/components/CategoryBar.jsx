import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/70 shadow-sm px-4 md:px-6 py-2.5">
      <div className="relative">
        <button
          type="button"
          onClick={handleScrollLeft}
          aria-label="Scroll categories left"
          disabled={!canScrollLeft}
          className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 md:flex md:z-20"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2 md:px-16"
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
        <button
          type="button"
          onClick={handleScrollRight}
          aria-label="Scroll categories right"
          disabled={!canScrollRight}
          className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 md:flex md:z-20"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
