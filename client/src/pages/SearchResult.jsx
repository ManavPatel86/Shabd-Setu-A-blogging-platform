import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import BlogCard from '@/components/BlogCard';
import BackButton from '@/components/BackButton';
import Loading from '@/components/Loading';
import { getEnv } from '@/helpers/getEnv';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RouteProfileView } from '@/helpers/RouteName';
import { getDisplayName } from '@/utils/functions';

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

  const blogEndpoint = useMemo(() => {
    if (!hasQuery) return '';
    const encoded = encodeURIComponent(q);
    return `${getEnv('VITE_API_BASE_URL')}/blog/search?q=${encoded}`;
  }, [hasQuery, q]);

  const userEndpoint = useMemo(() => {
    if (!hasQuery) return '';
    const encoded = encodeURIComponent(q);
    return `${getEnv('VITE_API_BASE_URL')}/user/search?query=${encoded}`;
  }, [hasQuery, q]);

  useEffect(() => {
    if (!hasQuery) {
      setBlogs([]);
      setAuthors([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError('');

        const [blogResponse, userResponse] = await Promise.all([
          fetch(blogEndpoint, {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch(userEndpoint, {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          })
        ]);

        if (!blogResponse.ok) {
          const body = await blogResponse.json().catch(() => ({}));
          throw new Error(body?.message || 'Failed to load blog results.');
        }

        const blogData = await blogResponse.json();
        const userData = userResponse.ok ? await userResponse.json() : { users: [] };

        setBlogs(Array.isArray(blogData?.blog) ? blogData.blog : []);
        const blogAuthors = Array.isArray(blogData?.authors) ? blogData.authors : [];
        const usernameMatches = Array.isArray(userData?.users) ? userData.users : [];
        
        // Combine and deduplicate authors
        const authorMap = new Map();
        [...blogAuthors, ...usernameMatches].forEach(author => {
          if (author?._id) {
            authorMap.set(author._id, author);
          }
        });
        setAuthors(Array.from(authorMap.values()));
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
  }, [blogEndpoint, userEndpoint, hasQuery]);

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
    <div className="mx-auto flex max-w-6xl flex-col space-y-10 px-4 py-10 text-slate-900 sm:px-8 lg:px-12">
      <BackButton className="mb-4" />
      <section className="relative overflow-hidden rounded-4xl bg-gradient-to-r from-[#6C5CE7] to-[#8A74F7] px-6 py-10 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] sm:px-10">
        <div className="absolute inset-y-0 right-0 h-full w-64 translate-x-1/3 rounded-full bg-white/15 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Discover</p>
          <h2 className="text-3xl font-black leading-tight sm:text-4xl">
            Search Results{hasQuery ? ` for “${q}”` : ''}
          </h2>
          <p className="max-w-2xl text-sm text-white/85 sm:text-base">
            Explore matching authors and blogs. Click a creator to visit their profile or open a blog card to keep reading.
          </p>
          {(authors.length > 0 || blogs.length > 0) ? (
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-white/75">
              {authors.length > 0 && (
                <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                  {authors.length} author{authors.length !== 1 ? 's' : ''}
                </span>
              )}
              {blogs.length > 0 && (
                <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                  {blogs.length} blog{blogs.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-6 rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Creators</p>
            <h3 className="text-2xl font-semibold">Authors</h3>
          </div>
          <span className="text-sm text-slate-500">{authors.length} match{authors.length !== 1 ? 'es' : ''}</span>
        </div>
        {authors.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {authors.map((author) => {
              const displayName = getDisplayName(author);
              const bio = author?.bio || '';
              const bioPreview = bio.length > 140 ? `${bio.slice(0, 137)}...` : bio;
              const avatarSrc = author?.avatar;
              const usernameHandle = author?.username ? `@${author.username}` : '';
              const initialsSource = (author?.name?.trim() || author?.username || 'U').toString();
              const initials = initialsSource.charAt(0).toUpperCase();
              const handleAuthorClick = () => {
                if (author?._id) {
                  navigate(RouteProfileView(author._id));
                }
              };

              return (
                <div
                  key={author._id}
                  onClick={handleAuthorClick}
                  className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-40px_rgba(15,23,42,0.6)] transition hover:-translate-y-1 hover:border-[#6C5CE7]/40 hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-[#6C5CE7]/15 transition group-hover:ring-[#6C5CE7]/40">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                      {usernameHandle && (
                        <p className="text-xs text-slate-500">{usernameHandle}</p>
                      )}
                      {author.role && (
                        <span className="inline-flex items-center rounded-full border border-[#6C5CE7]/30 bg-[#6C5CE7]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6C5CE7]">
                          {author.role}
                        </span>
                      )}
                    </div>
                  </div>
                  {bioPreview && (
                    <p className="text-sm text-slate-500 line-clamp-2">{bioPreview}</p>
                  )}
                  <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400 group-hover:text-[#6C5CE7]">
                    View profile
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-8 py-10 text-center text-sm text-slate-500">
            No authors matched your search.
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-4xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
        <div className="border-b border-slate-200 pb-3">
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Posts</p>
          <h3 className="text-2xl font-semibold">Blogs</h3>
        </div>
        <div className="grid grid-cols-1 gap-8 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center text-slate-500">
              No blogs matched your search. Try a different keyword or check your spelling.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchResult;