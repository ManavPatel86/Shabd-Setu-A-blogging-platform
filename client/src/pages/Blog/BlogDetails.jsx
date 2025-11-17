import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Search as SearchIcon,
    PenTool,
    Plus,
    Edit3,
    Trash2,
    MoreVertical,
    ChevronRight,
    Palette,
    Film,
    Trophy,
    Landmark,
    Newspaper,
    GraduationCap,
    Briefcase,
    FolderOpen,
    Bookmark,
} from 'lucide-react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Loading from '@/components/Loading';
import { useFetch } from '@/hooks/useFetch';
import { getEnv } from '@/helpers/getEnv';
import { deleteData } from '@/helpers/handleDelete';
import { showToast } from '@/helpers/showToast';
import { RouteBlogAdd, RouteBlogEdit } from '@/helpers/RouteName';

/* ---------------- CATEGORY / TAG CONFIG ---------------- */

const CATEGORY_STYLES = [
    { matcher: /art|design/i, icon: Palette, colorClass: 'bg-orange-50 text-orange-600 border-orange-100' },
    { matcher: /movie|tv|film/i, icon: Film, colorClass: 'bg-purple-50 text-purple-600 border-purple-100' },
    { matcher: /sport|game|fitness/i, icon: Trophy, colorClass: 'bg-pink-50 text-pink-600 border-pink-100' },
    { matcher: /politic|government/i, icon: Landmark, colorClass: 'bg-blue-50 text-blue-600 border-blue-100' },
    { matcher: /news|update|press/i, icon: Newspaper, colorClass: 'bg-gray-50 text-gray-600 border-gray-200' },
    { matcher: /education|learning|study/i, icon: GraduationCap, colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { matcher: /business|startup|career/i, icon: Briefcase, colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { matcher: /.*/, icon: FolderOpen, colorClass: 'bg-slate-50 text-slate-600 border-slate-200' },
];

/* ---------------- SMALL UI COMPONENTS ---------------- */

const CategoryPill = ({ icon, name, colorClass }) => (
    <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.15em] uppercase border ${colorClass} shadow-sm backdrop-blur hover:-translate-y-0.5 hover:shadow-md transition-all`}
    >
        {icon}
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

const getCategoryMeta = (label) => {
    const style = CATEGORY_STYLES.find((item) => item.matcher.test(label))
        || CATEGORY_STYLES[CATEGORY_STYLES.length - 1];
    const Icon = style.icon;

    return {
        name: label,
        colorClass: style.colorClass,
        icon: <Icon size={14} />,
    };
};

/* ---------------- TABLE ROW ---------------- */

const TableRow = ({ blog, isAdmin, currentUserId, onDelete }) => {
    const authorName = blog?.author?.name || 'Unknown Author';
    const isOwner = currentUserId && blog?.author?._id === currentUserId;
    const categories = getCategoryLabels(blog).map(getCategoryMeta);
    const formattedDate = blog?.createdAt ? moment(blog.createdAt).format('DD-MM-YYYY') : '—';
    const avatarSrc = blog?.author?.avatar || blog?.author?.profilePicture || '';
    const authorInitial = (authorName || 'S').charAt(0).toUpperCase();

    return (
        <tr className="group border-b border-gray-100 last:border-0 hover:bg-purple-50/40 transition-colors">
            <td className="py-4 px-6 align-middle">
                <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border border-gray-100 shadow-sm">
                        <AvatarImage src={avatarSrc || undefined} alt={authorName} className="object-cover" />
                        <AvatarFallback className="text-[#6C5CE7] text-sm font-semibold bg-purple-50">
                            {authorInitial}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <span className="text-gray-800 font-semibold text-sm group-hover:text-gray-900 transition-colors">
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

            <td className="py-4 px-4 align-middle">
                <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-semibold text-sm leading-relaxed line-clamp-2 group-hover:text-[#6C5CE7] transition-colors duration-200">
                        {blog?.title || 'Untitled blog'}
                    </p>
                    <ChevronRight className="text-gray-300" size={16} />
                </div>
            </td>

            <td className="py-4 px-4 align-middle">
                <div className="flex flex-wrap gap-2.5">
                    {categories.map((cat, idx) => (
                        <CategoryPill key={`${blog?._id || idx}-${cat.name}`} {...cat} />
                    ))}
                </div>
            </td>

            <td className="py-4 px-4 align-middle whitespace-nowrap">
                <span className="text-gray-600 text-xs font-semibold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 whitespace-nowrap">
                    {formattedDate}
                </span>
            </td>

            <td className="py-4 px-6 align-middle text-right">
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
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
        <div className="space-y-7 text-gray-900 px-3 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-10">
            <section className="rounded-[28px] border border-gray-100 bg-white/80 px-6 py-7 lg:px-10 backdrop-blur-md shadow-[0_30px_80px_-55px_rgba(15,23,42,0.65)]">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                            Dashboard • My Blogs
                        </p>
                        <h1 className="text-4xl font-black text-gray-900">
                            Publishing control room
                        </h1>
                        <p className="text-sm text-gray-500 max-w-2xl">
                            Refine drafts, track performance, and act on feedback without leaving this surface.
                        </p>
                    </div>

                    <Link
                        to={RouteBlogAdd}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-200/70 transition hover:shadow-xl"
                    >
                        <Plus size={18} />
                        Add Blog
                    </Link>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="flex items-center gap-3 rounded-3xl border border-gray-100 bg-white/80 px-4 py-3 shadow-sm">
                        <SearchIcon size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search blogs, categories or authors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                        />
                    </div>

                    <div className="rounded-3xl border border-gray-100 bg-white/70 px-5 py-4 shadow-sm">
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
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-10`} />
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
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
                    <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-gray-400">
                            Publishing queue
                        </p>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">My Blogs</h2>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                {blogs.length} total
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">Monitor drafts and live stories without switching context.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-2xl border px-4 py-2 text-xs font-semibold transition bg-[#6C5CE7] text-white border-transparent shadow-md shadow-purple-200"
                        >
                            All
                        </button>
                        <button
                            className="p-2 rounded-2xl border border-gray-200 text-gray-400 hover:text-[#6C5CE7] hover:border-[#6C5CE7]/40"
                            aria-label="More filters"
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                                <th className="px-6 py-4">Author</th>
                                <th className="px-4 py-4">Title</th>
                                <th className="px-4 py-4">Categories</th>
                                <th className="px-4 py-4">Date</th>
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
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="mx-auto max-w-sm space-y-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-8">
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

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {categoryFrequency.map(([label, count]) => {
                            const width = Math.round((count / maxCategoryCount) * 100);
                            return (
                                <div
                                    key={label}
                                    className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4"
                                >
                                    <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                                        <span>{label}</span>
                                        <span>{count} posts</span>
                                    </div>
                                    <div className="mt-3 h-2 rounded-full bg-white/80">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6]"
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