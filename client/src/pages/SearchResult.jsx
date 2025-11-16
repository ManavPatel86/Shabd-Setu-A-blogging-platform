import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import BlogCard from '@/components/BlogCard';
import Loading from '@/components/Loading';
import { getEnv } from '@/helpers/getEnv';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RouteProfileView } from '@/helpers/RouteName';

const SearchResult = () => {
  const [searchParams] = useSearchParams();
  const rawQuery = searchParams.get('q') || '';
  const q = rawQuery.trim();
  const hasQuery = q.length > 0;

  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const endpoint = useMemo(() => {
    if (!hasQuery) return '';
    const encoded = encodeURIComponent(q);
    return `${getEnv('VITE_API_BASE_URL')}/blog/search?q=${encoded}`;
  }, [hasQuery, q]);

  useEffect(() => {
    if (!hasQuery) {
      setBlogs([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || 'Failed to load search results.');
        }

        const data = await response.json();
        setBlogs(Array.isArray(data?.blog) ? data.blog : []);
        setAuthors(Array.isArray(data?.authors) ? data.authors : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load search results.');
        setBlogs([]);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    return () => controller.abort();
  }, [endpoint, hasQuery]);

  if (!hasQuery) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        Enter a search term above to find blogs and authors.
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="w-full space-y-10">
      <div className="pb-3 border-b mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">
          Search Results{hasQuery ? ` for "${q}"` : ''}
        </h2>
      </div>

      {authors.length > 0 && (
        <section>
          <div className="pb-3 border-b mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Authors</h3>
            <span className="text-sm text-slate-500">{authors.length} match{authors.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {authors.map((author) => {
              const name = author?.name || 'Unknown';
              const bio = author?.bio || '';
              const bioPreview = bio.length > 140 ? `${bio.slice(0, 137)}...` : bio;
              const avatarSrc = author?.avatar;
              const handleAuthorClick = () => {
                if (author?._id) {
                  navigate(RouteProfileView(author._id));
                }
              };

              return (
                <div
                  key={author._id}
                  onClick={handleAuthorClick}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{name}</p>
                      {author.role && (
                        <p className="text-xs uppercase tracking-wide text-blue-500">{author.role}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="pb-3 border-b mb-4">
          <h3 className="text-xl font-semibold">Blogs</h3>
        </div>
        <div className="space-y-5">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              No blogs matched your search. Try a different keyword or check your spelling.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchResult;