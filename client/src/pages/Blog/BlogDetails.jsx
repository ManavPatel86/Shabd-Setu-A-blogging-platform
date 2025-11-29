import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import BackButton from '@/components/BackButton';
import {
    Search as SearchIcon,
    PenTool,
    Plus,
    Edit3,
    Trash2,
    ChevronRight,
    Trophy,
    Briefcase,
    FolderOpen,
} from 'lucide-react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Loading from '@/components/Loading';
import { useFetch } from '@/hooks/useFetch';
import { getEnv } from '@/helpers/getEnv';
import { deleteData } from '@/helpers/handleDelete';
import { showToast } from '@/helpers/showToast';
import { RouteBlog, RouteBlogAdd, RouteBlogDetails, RouteBlogEdit } from '@/helpers/RouteName';

/* ---------------- SMALL UI COMPONENTS ---------------- */

const CategoryPill = ({ name }) => (
    <span
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.15em] uppercase border bg-slate-50 text-slate-600 border-slate-200 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:shadow-md transition-all"
    >
        {name}
    </span>
);

/* ---------------- CATEGORY HELPERS ---------------- */

const isNumericString = (value) => /^\d+$/.test(value);
const isObjectIdString = (value) => /^[a-f0-9]{24}$/i.test(value);

const normalizeCategoryLabel = (value) => {
    if (!value) return 'Uncategorized';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || isNumericString(trimmed) || isObjectIdString(trimmed)) {
            return 'Uncategorized';
        }
        return trimmed;
    }

    if (typeof value === 'object') {
        const nameCandidate =
            (typeof value.name === 'string' && value.name.trim()) ||
            (typeof value.label === 'string' && value.label.trim());

        if (
            nameCandidate &&
            !isNumericString(nameCandidate) &&
            !isObjectIdString(nameCandidate)
        ) {
            return nameCandidate;
        }
    }

    return 'Uncategorized';
};

const getCategoryLabels = (blog) => {
    if (Array.isArray(blog?.categories) && blog.categories.length > 0) {
        const labels = blog.categories.map((category) => normalizeCategoryLabel(category)).filter(Boolean);
        return labels.length ? labels : ['Uncategorized'];
    }

    if (blog?.category) {
        if (Array.isArray(blog.category) && blog.category.length > 0) {
            const labels = blog.category.map((category) => normalizeCategoryLabel(category)).filter(Boolean);
            return labels.length ? labels : ['Uncategorized'];
        }

        if (typeof blog.category === 'string' || typeof blog.category === 'object') {
            return [normalizeCategoryLabel(blog.category)];
        }
    }

    return ['Uncategorized'];
};

const slugifyLabel = (value = '') => {
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'uncategorized';
};

const resolveCategorySlug = (blog) => {
    if (Array.isArray(blog?.categories)) {
        for (const category of blog.categories) {
            if (category && typeof category === 'object' && category.slug) {
                return category.slug;
            }
            if (typeof category === 'string' && category.trim().length > 0) {
                return slugifyLabel(category);
            }
        }
    }

    const category = blog?.category;
    if (category && typeof category === 'object' && category.slug) {
        return category.slug;
    }

    if (Array.isArray(category)) {
        for (const entry of category) {
            if (entry && typeof entry === 'object' && entry.slug) {
                return entry.slug;
            }
            if (typeof entry === 'string' && entry.trim().length > 0) {
                return slugifyLabel(entry);
            }
        }
    }

    if (typeof category === 'string' && category.trim().length > 0) {
        return slugifyLabel(category);
    }

    return 'uncategorized';
};

const getBlogDetailPath = (blog) => {
    const isDraft = (blog?.status || '').toLowerCase() === 'draft';
    const blogIdentifier = (blog?.slug || '').toString().trim();
    const blogId = (blog?._id || '').toString().trim();

    if (isDraft) {
        return blogId ? RouteBlogEdit(blogId) : RouteBlogAdd;
    }

    const detailIdentifier = blogIdentifier || blogId;
    if (!detailIdentifier) {
        return RouteBlog;
    }

    const categorySlug = resolveCategorySlug(blog);
    return RouteBlogDetails(categorySlug, detailIdentifier);
};

const getStatusMeta = (status) => {
    const normalized = (status || '').toLowerCase() === 'draft' ? 'draft' : 'published';
    if (normalized === 'draft') {
        return {
            label: 'Draft',
            className: 'bg-amber-50 text-amber-700 border border-amber-100'
        };
    }

    return {
        label: 'Published',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    };
};

/* ---------------- TABLE ROW ---------------- */

const TableRow = ({ blog, isAdmin, currentUserId, onDelete }) => {
    const authorName = blog?.author?.name || 'Unknown Author';
    const isOwner = currentUserId && blog?.author?._id === currentUserId;
    const categories = getCategoryLabels(blog);
    const formattedDate = blog?.createdAt ? moment(blog.createdAt).format('DD-MM-YYYY') : '—';
    const avatarSrc = blog?.author?.avatar || blog?.author?.profilePicture || '';
    const authorInitial = (authorName || 'S').charAt(0).toUpperCase();
    const statusMeta = getStatusMeta(blog?.status);

    const detailPath = getBlogDetailPath(blog);

    return (
        <tr className="transition-colors border-b border-gray-100 group last:border-0 hover:bg-purple-50/40">
            <td className="px-6 py-4 align-middle">
                <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 border border-gray-100 shadow-sm">
                        <AvatarImage src={avatarSrc || undefined} alt={authorName} className="object-cover" />
                        <AvatarFallback className="text-[#6C5CE7] text-sm font-semibold bg-purple-50">
                            {authorInitial}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-gray-900">
                            {authorName}
                        </span>
                        {!isAdmin && isOwner && (
                            <p className="text-[11px] uppercase tracking-wider text-purple-500 font-bold">
                                You
                            </p>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-4 py-4 align-middle">
                <Link
                    to={detailPath}
                    className="flex items-center gap-2 text-gray-900 font-semibold text-sm leading-relaxed line-clamp-2 transition-colors duration-200 hover:text-[#6C5CE7]"
                >
                    {blog?.title || 'Untitled blog'}
                </Link>
            </td>

            <td className="px-4 py-4 align-middle">
                <div className="flex flex-wrap gap-2.5">
                    {categories.map((cat, idx) => (
                        <CategoryPill key={`${blog?._id || idx}-${cat}`} name={cat} />
                    ))}
                </div>
            </td>

            <td className="px-4 py-4 align-middle whitespace-nowrap">
                <span className="text-gray-600 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 whitespace-nowrap">
                    {formattedDate}
                </span>
            </td>

            <td className="px-4 py-4 align-middle whitespace-nowrap">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusMeta.className}`}>
                    {statusMeta.label}
                </span>
            </td>

            <td className="px-6 py-4 text-right align-middle">
                <div className="flex items-center justify-end gap-3 transition-all">
                    <Link
                        to={RouteBlogEdit(blog._id)}
                        className="p-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 text-gray-500 shadow-sm hover:text-[#6C5CE7] hover:border-purple-200 hover:bg-purple-50 hover:-translate-y-0.5 transition-all"
                        aria-label="Edit blog"
                    >
                        <Edit3 size={16} />
                    </Link>
                    <button
                        onClick={() => onDelete(blog._id)}
                        className="p-2.5 rounded-xl bg-white/90 backdrop-blur border border-gray-200 text-gray-500 shadow-sm hover:text-red-500 hover:border-red-200 hover:bg-red-50 hover:-translate-y-0.5 transition-all"
                        aria-label="Delete blog"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const MobileBlogCard = ({ blog, isAdmin, currentUserId, onDelete }) => {
    const authorName = blog?.author?.name || 'Unknown Author';
    const isOwner = currentUserId && blog?.author?._id === currentUserId;
    const categories = getCategoryLabels(blog);
    const formattedDate = blog?.createdAt ? moment(blog.createdAt).format('DD MMM YYYY') : '—';
    const avatarSrc = blog?.author?.avatar || blog?.author?.profilePicture || '';
    const authorInitial = (authorName || 'S').charAt(0).toUpperCase();
    const statusMeta = getStatusMeta(blog?.status);
    const isDraft = (blog?.status || '').toLowerCase() === 'draft';

    return (
        <div className="p-4 space-y-3 border border-gray-100 shadow-sm rounded-3xl bg-white/95">
            <div className="flex items-center gap-3">
                <Avatar className="border border-gray-100 h-11 w-11">
                    <AvatarImage src={avatarSrc || undefined} alt={authorName} className="object-cover" />
                    <AvatarFallback className="text-[#6C5CE7] text-sm font-semibold bg-purple-50">
                        {authorInitial}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{authorName}</p>
                    {!isAdmin && isOwner && (
                        <p className="text-[10px] uppercase tracking-[0.3em] text-purple-500 font-bold">You</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-500 border border-gray-100">
                        {formattedDate}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${statusMeta.className}`}>
                        {statusMeta.label}
                    </span>
                </div>
            </div>

            <div>
                <p className="text-base font-semibold leading-snug text-gray-900">
                    {blog?.title || 'Untitled blog'}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((cat, idx) => (
                        <CategoryPill key={`${blog?._id || idx}-${cat}-mobile`} name={cat} />
                    ))}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <Link
                    to={getBlogDetailPath(blog)}
                    className="inline-flex items-center gap-1 text-[#6C5CE7] font-semibold"
                >
                    {isDraft ? 'Edit draft' : 'View blog'}
                    <ChevronRight size={14} />
                </Link>
                <div className="flex items-center gap-2">
                    <Link
                        to={RouteBlogEdit(blog._id)}
                        className="p-2 rounded-2xl border border-gray-200 text-gray-500 hover:text-[#6C5CE7] hover:border-purple-200 transition"
                        aria-label="Edit blog"
                    >
                        <Edit3 size={14} />
                    </Link>
                    <button
                        onClick={() => onDelete(blog._id)}
                        className="p-2 text-gray-500 transition border border-gray-200 rounded-2xl hover:text-red-500 hover:border-red-200"
                        aria-label="Delete blog"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ---------------- MAIN PAGE ---------------- */

const BlogDetails = () => {
    const [refreshData, setRefreshData] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const blogsEndpoint = `${getEnv('VITE_API_BASE_URL')}/blog/get-all`;

    const { data: blogData, loading, error } = useFetch(
        blogsEndpoint,
        {
            method: 'get',
            credentials: 'include',
        },
        [refreshData, blogsEndpoint],
    );

    const user = useSelector((state) => state.user);

    const isAdmin = user?.user?.role === 'admin';
    const currentUserId = user?.user?._id;

    const blogs = Array.isArray(blogData?.blog) ? blogData.blog : [];

    /* --------- Derived values --------- */

    const sortedBlogs = useMemo(
        () => [...blogs].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)),
        [blogs],
    );

    const filteredBlogs = useMemo(() => {
        if (!searchTerm) return sortedBlogs;
        const query = searchTerm.toLowerCase();
        return sortedBlogs.filter((blog) => {
            const titleMatch = blog?.title?.toLowerCase().includes(query);
            const authorMatch = blog?.author?.name?.toLowerCase().includes(query);
            const categoryMatch = getCategoryLabels(blog).some((label) => label.toLowerCase().includes(query));
            return titleMatch || authorMatch || categoryMatch;
        });
    }, [sortedBlogs, searchTerm]);

    const uniqueCategories = useMemo(() => {
        const set = new Set();
        blogs.forEach((blog) => {
            getCategoryLabels(blog).forEach((label) => set.add(label));
        });
        return set;
    }, [blogs]);

    const categoryFrequency = useMemo(() => {
        const freq = {};
        blogs.forEach((blog) => {
            getCategoryLabels(blog).forEach((label) => {
                freq[label] = (freq[label] || 0) + 1;
            });
        });
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    }, [blogs]);

    const latestUpdate = blogs.reduce((latest, blog) => {
        if (!blog?.createdAt) return latest;
        const date = new Date(blog.createdAt);
        return date > latest ? date : latest;
    }, new Date(0));

    const totalResults = filteredBlogs.length;
    const maxCategoryCount = categoryFrequency[0]?.[1] || 1;
    const topCategoryEntry = categoryFrequency[0];

    const metricsCards = [
        {
            label: 'Total Blogs',
            value: blogs.length,
            meta: 'Active publications',
            accent: 'from-[#6C5CE7] to-[#8E63FF]',
            icon: PenTool,
        },
        {
            label: 'Categories Covered',
            value: uniqueCategories.size,
            meta: 'Diverse topics',
            accent: 'from-emerald-400 to-emerald-600',
            icon: FolderOpen,
        },
        ...(topCategoryEntry
            ? [
                  {
                      label: 'Top Category',
                      value: topCategoryEntry[0],
                      meta: `${topCategoryEntry[1]} posts`,
                      accent: 'from-orange-400 to-pink-500',
                      icon: Trophy,
                  },
              ]
            : []),
        {
            label: 'Last Update',
            value: latestUpdate.getTime() ? moment(latestUpdate).format('DD MMM YYYY') : '—',
            meta: 'Most recent publish',
            accent: 'from-blue-400 to-indigo-500',
            icon: Briefcase,
        },
    ];

    const handleDelete = async (id) => {
        const deleted = await deleteData(`${getEnv('VITE_API_BASE_URL')}/blog/delete/${id}`);
        if (deleted) {
            setRefreshData(!refreshData);
            showToast('success', 'Blog deleted successfully');
        }
    };

    /* --------- Loading / Error --------- */

    if (loading) return <Loading />;
    if (error) return <div className="text-red-500">Error loading blogs: {error.message}</div>;

    /* --------- UI --------- */

    return (
        <div className="px-3 pt-6 pb-10 text-gray-900 space-y-7 sm:px-6 lg:px-10 lg:pt-10">
            <BackButton className="mb-6" />
            <section className="rounded-[28px] border border-gray-100 bg-white/80 px-5 sm:px-6 lg:px-10 py-6 lg:py-7 backdrop-blur-md shadow-[0_30px_80px_-55px_rgba(15,23,42,0.65)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                            Dashboard • My Blogs
                        </p>
                        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Publishing control room
                        </h1>
                        <p className="max-w-2xl text-sm text-gray-500">
                            Refine drafts, track performance, and act on feedback without leaving this surface.
                        </p>
                    </div>

                    <Link
                        to={RouteBlogAdd}
                        className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/70 transition hover:shadow-xl"
                    >
                        <Plus size={18} />
                        Add Blog
                    </Link>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="flex flex-col gap-3 px-4 py-3 border border-gray-100 shadow-sm sm:flex-row sm:items-center rounded-3xl bg-white/80">
                        <SearchIcon size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search blogs, categories or authors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 text-sm text-gray-700 bg-transparent outline-none placeholder:text-gray-400"
                        />
                    </div>

                    <div className="px-5 py-4 border border-gray-100 shadow-sm rounded-3xl bg-white/70">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-gray-400">
                            Matching results
                        </p>
                        <p className="mt-2 text-3xl font-black text-gray-900">
                            {totalResults}
                        </p>
                        <p className="text-xs text-gray-500">Based on current filters</p>
                    </div>
                </div>

            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricsCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/75 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]"
                        >
                            <div className={`absolute inset-0 bg-linear-to-br ${card.accent} opacity-10`} />
                            <div className="relative flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                                        {card.label}
                                    </p>
                                    <p className="text-3xl font-black text-gray-900">{card.value}</p>
                                    <p className="text-xs text-gray-500">{card.meta}</p>
                                </div>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-[#6C5CE7]">
                                    <Icon size={18} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white/85 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.5)]">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-gray-100">
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-gray-400">
                            Publishing queue
                        </p>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">My Blogs</h2>
                            <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                                {blogs.length} total
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Monitor drafts and live stories without switching context.</p>
                    </div>

                    <div className="flex items-center gap-2" />
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                                <th className="px-6 py-4">Author</th>
                                <th className="px-4 py-4">Title</th>
                                <th className="px-4 py-4">Categories</th>
                                <th className="px-4 py-4">Date</th>
                                <th className="px-4 py-4">Visibility</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {filteredBlogs.length > 0 ? (
                                filteredBlogs.map((blog) => (
                                    <TableRow
                                        key={blog._id}
                                        blog={blog}
                                        isAdmin={isAdmin}
                                        currentUserId={currentUserId}
                                        onDelete={handleDelete}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="max-w-sm px-6 py-8 mx-auto space-y-2 border border-gray-200 border-dashed rounded-3xl bg-gray-50/80">
                                            <p className="text-base font-semibold text-gray-700">No blogs match your search</p>
                                            <p className="text-sm text-gray-500">
                                                Try adjusting your keywords or clear filters to see all entries.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 pt-4 pb-5 space-y-4 md:hidden">
                    {filteredBlogs.length > 0 ? (
                        filteredBlogs.map((blog) => (
                            <MobileBlogCard
                                key={`${blog._id}-mobile`}
                                blog={blog}
                                isAdmin={isAdmin}
                                currentUserId={currentUserId}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        <div className="max-w-sm px-6 py-8 mx-auto space-y-2 text-center border border-gray-200 border-dashed rounded-3xl bg-gray-50/80">
                            <p className="text-base font-semibold text-gray-700">No blogs match your search</p>
                            <p className="text-sm text-gray-500">Try adjusting your keywords or clear filters to see all entries.</p>
                        </div>
                    )}
                </div>
            </section>

            {categoryFrequency.length > 0 && (
                <section className="rounded-[28px] border border-gray-100 bg-white/80 px-6 py-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">
                                Popular categories
                            </p>
                            <p className="text-sm text-gray-500">Where your audience spends the most time.</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{uniqueCategories.size} active topics</span>
                    </div>

                    <div className="grid gap-4 mt-6 md:grid-cols-3">
                        {categoryFrequency.map(([label, count]) => {
                            const width = Math.round((count / maxCategoryCount) * 100);
                            return (
                                <div
                                    key={label}
                                    className="p-4 border border-gray-100 rounded-3xl bg-gray-50/80"
                                >
                                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                                        <span>{label}</span>
                                        <span>{count} posts</span>
                                    </div>
                                    <div className="h-2 mt-3 rounded-full bg-white/80">
                                        <div
                                            className="h-full rounded-full bg-linear-to-r from-[#6C5CE7] to-[#8B5CF6]"
                                            style={{ width: `${width}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default BlogDetails;