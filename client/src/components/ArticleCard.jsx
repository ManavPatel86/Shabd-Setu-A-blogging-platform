import React from "react";
import { Heart, MessageCircle, Share2, Bot, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ArticleCard = ({ blog }) => {
  const { id, thumbnail, title, description, author, profile, createdAt, filter } = blog;
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
      <div onClick={() => navigate(`/blog/${id}`)}>
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="relative w-full h-48 overflow-hidden">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src={thumbnail}
              alt={title}
            />
          </div>

          <div className="p-4">
            <div className="mb-3">
              <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
                {filter}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2 text-black leading-tight line-clamp-2">
              {title}
            </h3>

            <p
              className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3"
              dangerouslySetInnerHTML={{ __html: description.slice(0, 150) + "..." }}
            ></p>

            <div className="flex items-center mb-3">
              <img
                className="w-8 h-8 rounded-full mr-3 border border-gray-200"
                src={profile}
                alt="Author"
              />
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium text-sm text-gray-700">{author}</span>
                <span>•</span>
                <span>{createdAt}</span>
                <span>•</span>
                <span className="text-green-500 font-semibold">2.6K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex h-48 lg:h-56">
          <div className="flex-1 p-4 md:p-6 lg:p-7 flex flex-col justify-between">
            <div className="mb-2">
              <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-medium">
                {filter}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-black leading-snug line-clamp-2 lg:line-clamp-3">
                {title}
              </h3>

              <p
                className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3"
                dangerouslySetInnerHTML={{ __html: description.slice(0, 240) + "..." }}
              ></p>
            </div>

            <div className="flex items-center">
              <img
                className="w-8 h-8 md:w-10 md:h-10 rounded-full mr-2 border border-gray-200"
                src={profile}
                alt="Author"
              />
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium text-sm text-gray-700">{author}</span>
                <span>•</span>
                <span>{createdAt}</span>
                <span>•</span>
                <span className="text-green-500 font-semibold">2.6K</span>
              </div>
            </div>
          </div>

          <div className="relative w-32 md:w-36 lg:w-40 h-32 md:h-36 lg:h-40 flex-shrink-0 overflow-hidden rounded-lg my-4 md:my-6 mr-4 md:mr-6">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src={thumbnail}
              alt={title}
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 sm:px-6 lg:px-7 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm">Summary</span>
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-400 hover:text-gray-900 transition-colors" />
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-400 hover:text-gray-900 transition-colors" />
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-400 hover:text-gray-900 transition-colors" />
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer text-gray-400 hover:text-gray-900 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
