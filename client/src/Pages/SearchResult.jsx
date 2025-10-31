import BlogCard from '@/components/BlogCard';
import { getEnv } from '@/helpers/getEnv';
import { useFetch } from '@/hooks/useFetch';
import React from 'react';
import { useSearchParams } from "react-router-dom";

const SearchResult = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');

  const { data: blogData, loading, error } = useFetch(
    `${getEnv('VITE_API_BASE_URL')}/blog/search?q=${q}`,
    { method: 'get', credentials: 'include' }
  );

  if (loading) {
    return <div>Loading results...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading search results.</div>;
  }

  return (
    <>
      <div className="flex items-center gap-3 text-2xl font-bold text-violet-500 border-b pb-3 mb-5">
        <h4>Search Results for: {q}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
        {blogData && blogData.blog?.length > 0 ? (
          blogData.blog.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))
        ) : (
          <div>No results found.</div>
        )}
      </div>
    </>
  );
};

export default SearchResult;
