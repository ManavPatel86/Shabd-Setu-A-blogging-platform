import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteBlogDetails } from "@/helpers/RouteName";
import { decode } from "entities";

const FeaturedCard = ({ blog }) => {
  const navigate = useNavigate();

  if (!blog) return null;

  const {
    _id,
    slug,
    title,
    featuredImage,
    categories,
    category,
    featuredDescription,
    shortDescription,
    description,
    blogContent,
  } = blog;

  const categoryList = Array.isArray(categories)
    ? categories.filter(Boolean)
    : category
    ? [category]
    : [];

  const primaryCategory = categoryList[0]?.name || "Featured Post";

  const getExcerpt = () => {
    const rawContent =
      featuredDescription ||
      shortDescription ||
      description ||
      blogContent ||
      "";

    if (!rawContent) return "Dive into the story and explore more.";

    try {
      const plain = decode(rawContent.replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
      if (!plain) return "Dive into the story and explore more.";
      return plain.length > 220 ? `${plain.slice(0, 217)}...` : plain;
    } catch {
      return "Dive into the story and explore more.";
    }
  };

  const navigateToBlog = () => {
    const catSlug = categoryList[0]?.slug || "category";
    navigate(RouteBlogDetails(catSlug, slug || _id));
  };

  return (
    <div className="col-span-full bg-[#6C5CE7] rounded-[40px] p-10 mb-10 relative overflow-hidden text-white shadow-xl shadow-indigo-200">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-20 w-48 h-48 bg-purple-300 opacity-20 rounded-full blur-3xl translate-y-1/2" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 inline-block">
            {primaryCategory || "Featured Post"}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {title}
          </h2>
          <p className="text-white/90 text-lg leading-relaxed max-w-xl font-medium">
            {getExcerpt()}
          </p>
          <button
            onClick={navigateToBlog}
            className="mt-2 bg-white text-[#6C5CE7] px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-[15px]"
          >
            Start Reading <ChevronRight size={20} />
          </button>
        </div>
        <div className="w-full md:w-1/3 h-64 md:h-auto rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500">
          <img
            src={featuredImage || "/placeholder.jpg"}
            alt={title || "Featured"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default FeaturedCard;
