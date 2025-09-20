import { formatDate } from '../utils/functions';
import React from "react";

// The component is updated to accept props.
export const BlogCard = ({ title, slug, cover, publishDate, category }) => {
  return (
    <div className="mx-auto max-w-[400px]">
      <a href={slug} className="no-underline">
        <div
          key={slug}
          className="flex transform flex-col gap-3 transition-transform hover:scale-105"
        >
          <figure className="relative h-48 w-full overflow-hidden">
            <img
              src={cover}
              alt={title}
              className="h-full w-full rounded-xl bg-gray-200 object-cover"
            />
          </figure>

          <div className="mt-1 flex items-center gap-2">
            <span className="w-fit rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
              {category}
            </span>
            <p className="text-sm font-semibold text-gray-500">{formatDate(publishDate)}</p>
          </div>

          <h3 className="hover:text-theme mb-2 text-xl font-bold transition-colors duration-200">
            {title}
          </h3>
        </div>
      </a>
    </div>
  );
};
