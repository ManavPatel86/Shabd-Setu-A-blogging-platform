import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteBlogDetails } from "@/helpers/RouteName";
import { decode } from "entities";
import { getEnv } from "@/helpers/getEnv";
import { useFetch } from "@/hooks/useFetch";

const FeaturedCard = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Fetch highlight blogs
  const highlightEndpoint = `${getEnv("VITE_API_BASE_URL")}/blog/best-of-week`;
  const { data: highlightData, loading } = useFetch(
    highlightEndpoint,
    { method: "get", credentials: "include" },
    [highlightEndpoint]
  );

  const highlightLabel = highlightData?.meta?.label || "Best of the Week";
  const featuredBlogs = React.useMemo(() => {
    if (!highlightData?.blog) return [];
    const blogs = Array.isArray(highlightData.blog) ? highlightData.blog : [];
    return blogs.slice(0, 5);
  }, [highlightData]);

  // Auto-slide functionality
  useEffect(() => {
    if (featuredBlogs.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % featuredBlogs.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [featuredBlogs.length]);

  const goToNext = useCallback(() => {
    if (featuredBlogs.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredBlogs.length);
  }, [featuredBlogs.length]);

  const goToPrevious = useCallback(() => {
    if (featuredBlogs.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredBlogs.length) % featuredBlogs.length);
  }, [featuredBlogs.length]);

  const goToSlide = useCallback((index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  const getExcerpt = (blog) => {
    const rawContent =
      blog?.featuredDescription ||
      blog?.shortDescription ||
      blog?.description ||
      blog?.blogContent ||
      "";

    if (!rawContent) return "Dive into the story and explore more.";

    try {
      const plain = decode(rawContent.replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
      if (!plain) return "Dive into the story and explore more.";
      return plain.length > 150 ? `${plain.slice(0, 147)}...` : plain;
    } catch {
      return "Dive into the story and explore more.";
    }
  };

  const getCategoryName = (blog) => {
    const categories = Array.isArray(blog?.categories)
      ? blog.categories.filter(Boolean)
      : blog?.category
      ? [blog.category]
      : [];

    return categories[0]?.name || "Featured";
  };

  const getCategorySlug = (blog) => {
    const categories = Array.isArray(blog?.categories)
      ? blog.categories.filter(Boolean)
      : blog?.category
      ? [blog.category]
      : [];

    return categories[0]?.slug || "category";
  };

  const navigateToBlog = (blog) => {
    const catSlug = getCategorySlug(blog);
    navigate(RouteBlogDetails(catSlug, blog.slug || blog._id));
  };

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
      scale: 0.95,
    }),
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="col-span-full bg-gray-200 rounded-4xl mb-8 animate-pulse min-h-[360px] sm:min-h-[420px] flex items-center justify-center px-5 sm:px-10">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
            <div className="flex-1 w-full space-y-6">
              <div className="w-32 h-6 bg-gray-300 rounded-full"></div>
              <div className="space-y-3">
                <div className="w-full h-10 bg-gray-300 rounded-lg"></div>
                <div className="w-3/4 h-10 bg-gray-300 rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-300 rounded"></div>
                <div className="w-full h-4 bg-gray-300 rounded"></div>
                <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
              </div>
              <div className="w-40 h-12 bg-gray-300 rounded-full"></div>
            </div>
            <div className="w-full md:w-[45%] h-56 sm:h-72 bg-gray-300 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (featuredBlogs.length === 0) return null;

  const currentBlog = featuredBlogs[currentIndex];
  const currentCategory = currentBlog ? getCategoryName(currentBlog) : null;

  const highlightDetail = (() => {
    if (!currentBlog) return null;
    const likes = currentBlog.highlightLikes || 0;
    if (currentBlog.highlightReason === "weekly") {
      return likes > 0
        ? `${likes} likes in the last 7 days`
        : "Trending with readers this week";
    }
    if (currentBlog.highlightReason === "popular") {
      return likes > 0 ? `${likes} all-time likes` : "All-time favorite";
    }
    if (currentBlog.highlightReason === "recent") {
      return "Freshly published";
    }
    return null;
  })();

  return (
    <div className="col-span-full bg-[#6C5CE7] rounded-4xl sm:rounded-[40px] mb-10 relative overflow-hidden text-white shadow-xl shadow-indigo-200 min-h-[420px] md:min-h-[460px]">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-96 h-96 opacity-10 blur-3xl" />
      <div className="absolute bottom-0 w-48 h-48 translate-y-1/2 bg-purple-300 rounded-full left-20 opacity-20 blur-3xl" />

      <div className="relative z-10 flex items-center h-full px-5 py-8 sm:px-10 sm:py-10 lg:px-14">
        <div className="w-full max-w-6xl mx-auto">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
              }}
              className="flex flex-col items-center gap-8 md:flex-row md:gap-12"
            >
              {/* Left Content */}
              <div className="flex-1 flex flex-col text-center md:text-left gap-0">
                <div className="flex flex-col gap-5">
                  {currentCategory && (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 inline-block"
                    >
                      {currentCategory}
                    </motion.span>
                  )}

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl line-clamp-3"
                  >
                    {currentBlog.title}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="max-w-xl text-base font-medium leading-relaxed text-white/90 line-clamp-6 md:line-clamp-3"
                  >
                    {getExcerpt(currentBlog)}
                  </motion.p>

                  {highlightDetail && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="text-sm font-medium text-white/80"
                    >
                      {highlightDetail}
                    </motion.p>
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateToBlog(currentBlog)}
                  className="mx-auto md:mx-0 mt-8 bg-white text-[#6C5CE7] px-6 sm:px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2 text-sm sm:text-[15px]"
                >
                  Start Reading <ArrowRight size={20} />
                </motion.button>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="mt-auto pt-8 text-xl sm:text-2xl md:text-[28px] font-extrabold text-white uppercase tracking-[0.28em]"
                >
                  {highlightLabel}
                </motion.p>
              </div>

              {/* Right Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full md:w-[45%] h-56 sm:h-72 md:h-80 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl shrink-0"
              >
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  src={currentBlog.featuredImage || "/placeholder.jpg"}
                  alt={currentBlog.title || "Featured"}
                  className="object-cover w-full h-full"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {featuredBlogs.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPrevious}
                className="absolute left-4 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2.5 sm:p-3 rounded-full transition-all border border-white/20"
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNext}
                className="absolute right-4 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2.5 sm:p-3 rounded-full transition-all border border-white/20"
                aria-label="Next slide"
              >
                <ChevronRight size={24} />
              </motion.button>
            </>
          )}

          {/* Pagination Dots */}
          {featuredBlogs.length > 1 && (
            <div className="absolute flex gap-2 -translate-x-1/2 bottom-4 sm:bottom-6 left-1/2">
              {featuredBlogs.map((_, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedCard;
