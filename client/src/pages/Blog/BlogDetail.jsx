import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
    MessageCircle,
    Share2,
    Bot,
    Clock,
    Sparkles,
    PenTool,
    Bookmark,
} from 'lucide-react';
import LikeCount from '@/components/LikeCount';
import SaveButton from '@/components/SaveButton';
import SummaryModal from '@/components/SummaryModal';
import ViewCount from '@/components/ViewCount';
import { RouteBlogDetails, RouteProfileView } from '@/helpers/RouteName';
import { getEnv } from '@/helpers/getEnv';
import { showToast } from '@/helpers/showToast';
import { decode } from 'entities';

const FALLBACK_IMAGE = '/placeholder.jpg';

const CategoryPill = ({ label }) => (
    <span className="bg-white/90 text-[#6C5CE7] border border-purple-100/70 px-4 py-1.5 rounded-2xl text-[11px] font-semibold tracking-wide shadow-sm">
        {label}
    </span>
);

const normalizeCategories = (fromApi, legacyCategory) => {
    if (Array.isArray(fromApi) && fromApi.length) return fromApi;
    if (!legacyCategory) return [];
    return Array.isArray(legacyCategory) ? legacyCategory : [legacyCategory];
};

const isNumericString = (value) => /^\d+$/.test(value);
const isObjectIdString = (value) => /^[a-f0-9]{24}$/i.test(value);

const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') {
        const trimmed = category.trim();
        if (!trimmed || isNumericString(trimmed) || isObjectIdString(trimmed)) return 'Uncategorized';
        return trimmed;
    }
    if (typeof category === 'object') {
        const nameCandidate =
            (typeof category.name === 'string' && category.name.trim()) ||
            (typeof category.label === 'string' && category.label.trim());
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

const getCategorySlug = (category) => {
    if (!category) return 'uncategorized';
    if (typeof category === 'object') {
        if (category.slug) return category.slug;
        if (
            typeof category.name === 'string' &&
            category.name.trim() &&
            !isNumericString(category.name.trim()) &&
            !isObjectIdString(category.name.trim())
        ) {
            return category.name.trim().toLowerCase().replace(/\s+/g, '-');
        }
    }
    if (typeof category === 'string') {
        const trimmed = category.trim();
        return trimmed && !isNumericString(trimmed) && !isObjectIdString(trimmed)
            ? trimmed.toLowerCase().replace(/\s+/g, '-')
            : 'uncategorized';
    }
    return 'uncategorized';
};

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '');

const BlogDetail = ({ blog }) => {
    const navigate = useNavigate();
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [summary, setSummary] = useState('');
    const [summaryError, setSummaryError] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [cachedSummary, setCachedSummary] = useState('');
    const abortControllerRef = useRef(null);

    if (!blog) return null;

    const {
        _id,
        featuredImage,
        bannerImage,
        title,
        categories: categoriesFromApi,
        category,
        author,
        createdAt,
        blogContent,
        content,
        summary: presetSummary,
        slug,
        recommendedPosts,
        relatedPosts,
        views,
        readingTime,
    } = blog;

    const categories = useMemo(
        () => normalizeCategories(categoriesFromApi, category),
        [categoriesFromApi, category],
    );

    const categoryItems = useMemo(() => {
        if (!categories.length) {
            return [{ key: 'uncategorized', label: 'Uncategorized', slug: 'uncategorized' }];
        }

        return categories.map((entry, index) => {
            const label = getCategoryName(entry);
            return {
                key: (typeof entry === 'object' && (entry?._id || entry?.slug)) || `${label}-${index}`,
                label,
                slug: getCategorySlug(entry),
            };
        });
    }, [categories]);

    const formattedDate = useMemo(
        () => (createdAt ? moment(createdAt).format('DD MMM, YYYY') : 'Recently'),
        [createdAt],
    );

    const readLength = readingTime || blog?.meta?.readingTime || '5 min read';

    const primaryCategorySlug = categoryItems[0]?.slug || 'uncategorized';

    const featuredUrl = featuredImage || bannerImage || FALLBACK_IMAGE;

    const safeDescription = useMemo(() => stripHtml(blog?.description || ''), [blog?.description]);

    const recommended = useMemo(() => {
        const list = Array.isArray(recommendedPosts) && recommendedPosts.length
            ? recommendedPosts
            : Array.isArray(relatedPosts)
                ? relatedPosts
                : [];
        return list.slice(0, 3);
    }, [recommendedPosts, relatedPosts]);

    const articleBlocks = useMemo(() => {
        const raw = blogContent || content || presetSummary || '';
        if (!raw) return [];
        try {
            const decoded = decode(raw);
            return decoded
                .split(/<(?:p|div|h[1-6]|li)[^>]*>/gi)
                .map((segment) => segment.replace(/<[^>]+>/g, '').trim())
                .filter(Boolean);
        } catch (error) {
            return [stripHtml(raw)];
        }
    }, [blogContent, content, presetSummary]);

    const commentCount = useMemo(() => {
        if (typeof blog?.commentStats?.totalComments === 'number') {
            return blog.commentStats.totalComments;
        }
        if (Array.isArray(blog?.comments)) {
            return blog.comments.length;
        }
        return blog?.commentsCount || 0;
    }, [blog]);

    const summaryEndpoint = useMemo(
        () => `${getEnv('VITE_API_BASE_URL')}/blog/summary/${_id}`,
        [_id],
    );

    const fetchSummary = async (refresh = false) => {
        if (!_id) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setSummaryLoading(true);
            setSummaryError('');

            const query = refresh ? '?refresh=true' : '';
            const response = await fetch(`${summaryEndpoint}${query}`, {
                method: 'get',
                credentials: 'include',
                signal: controller.signal,
            });

            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result?.message || 'Failed to generate summary');
            }

            const text = result?.summary || '';
            if (result?.cached || !refresh) {
                setCachedSummary(text);
                setSummary(text);
            } else {
                setSummary(text || cachedSummary);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setSummaryError(err.message || 'Failed to generate summary');
                setSummary(cachedSummary || '');
            }
        } finally {
            setSummaryLoading(false);
        }
    };

    const openSummary = () => {
        setIsSummaryOpen(true);
        if (!cachedSummary && !summaryLoading) {
            fetchSummary(false);
        } else {
            setSummary(cachedSummary);
        }
    };

    const closeSummary = () => setIsSummaryOpen(false);

    const handleShare = async () => {
        const url = `${window.location.origin}${RouteBlogDetails(primaryCategorySlug, slug || _id)}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text: safeDescription.slice(0, 120),
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                showToast('success', 'Link copied to clipboard');
            }
        } catch {
            await navigator.clipboard.writeText(url);
            showToast('success', 'Link copied to clipboard');
        }
    };

    return (
        <div className="px-4 pb-10 space-y-8 text-gray-900 sm:space-y-10 sm:pb-12 sm:px-0">
            <section className="relative overflow-hidden rounded-3xl bg-gray-200 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.5)] min-h-[260px]">
                <img src={featuredUrl} alt={title} className="h-[260px] sm:h-[360px] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 space-y-3 sm:space-y-4 sm:p-8">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {categoryItems.map((cat) => (
                            <CategoryPill key={cat.key} label={cat.label} />
                        ))}
                    </div>
                    <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                        {title}
                    </h1>
                </div>
            </section>

            <section className="flex flex-col gap-6 px-5 py-5 bg-white border border-gray-100 shadow-sm rounded-3xl sm:px-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <img
                        src={author?.avatar || '/default-avatar.png'}
                        alt={author?.name}
                        className="object-cover w-16 h-16 border border-purple-100 rounded-full"
                    />
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Author</p>
                        <p className="text-xl font-semibold text-gray-900">{author?.name || 'Unknown Author'}</p>
                        <button
                            type="button"
                            onClick={() => author?._id && navigate(RouteProfileView(author._id))}
                            className="text-xs font-semibold text-[#6C5CE7] hover:underline"
                        >
                            View profile
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-600">
                    <span className="flex items-center gap-2">
                        <Clock size={16} className="text-[#6C5CE7]" />
                        {formattedDate}
                    </span>
                    <span className="flex items-center gap-2">
                        <Sparkles size={16} className="text-[#6C5CE7]" />
                        {readLength}
                    </span>
                    <span className="flex items-center gap-2">
                        <PenTool size={16} className="text-[#6C5CE7]" />
                        {typeof views === 'number' ? views : <ViewCount blogId={_id} addView />}
                    </span>
                </div>
            </section>

            <section className="p-5 bg-white border border-gray-100 shadow-sm rounded-3xl sm:p-8">
                <div className="prose prose-lg text-gray-700 max-w-none">
                    {articleBlocks.length ? (
                        articleBlocks.map((block, index) => (
                            <p key={index} className="mb-5 text-base sm:text-[17px] leading-relaxed text-gray-700">
                                {block}
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-400">No content available.</p>
                    )}
                </div>
            </section>

            <section className="p-5 space-y-5 bg-white border border-gray-100 shadow-sm rounded-3xl sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                    <LikeCount blogid={_id} variant="clean" />
                    <button
                        type="button"
                        onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 rounded-2xl bg-gray-50 hover:bg-gray-100"
                    >
                        <MessageCircle size={16} />
                        {commentCount} Comments
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:shadow-lg"
                    >
                        <Share2 size={16} />
                        Share
                    </button>
                    <SaveButton
                        blogId={_id}
                        size="sm"
                        withLabel
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                    />
                </div>

                <div className="flex flex-col gap-4 px-4 py-4 border border-gray-100 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-gray-50/70 sm:px-5">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Smart summary</p>
                        <p className="text-xs text-gray-500">AI highlights and talking points for this story.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openSummary}
                        className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-[#6C5CE7] shadow-sm hover:shadow-md"
                    >
                        <Bot size={16} />
                        Generate summary
                    </button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Recommended</p>
                        <h3 className="text-2xl font-bold text-gray-900">Continue reading</h3>
                    </div>
                    <Link to="/" className="text-sm font-semibold text-[#6C5CE7] hover:underline">
                        See all
                    </Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(recommended.length ? recommended : []).map((item, idx) => {
                        const recCategories = normalizeCategories(item?.categories, item?.category);
                        const recCategoryItems = recCategories.length
                            ? recCategories.map((entry, cIndex) => ({
                                  key:
                                      (typeof entry === 'object' && (entry?._id || entry?.slug)) ||
                                      `${getCategoryName(entry)}-${cIndex}`,
                                  label: getCategoryName(entry),
                                  slug: getCategorySlug(entry),
                              }))
                            : [{ key: `uncategorized-${idx}`, label: 'Uncategorized', slug: 'uncategorized' }];
                        const recSlug = recCategoryItems[0]?.slug || 'uncategorized';
                        return (
                            <div
                                key={item?._id || idx}
                                className="flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl"
                            >
                                <div className="h-40 overflow-hidden">
                                    <img
                                        src={item?.featuredImage || FALLBACK_IMAGE}
                                        alt={item?.title}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="flex flex-col flex-1 gap-4 p-5">
                                    <div className="flex flex-wrap gap-2">
                                        {recCategoryItems.map((cat) => (
                                            <CategoryPill key={cat.key} label={cat.label} />
                                        ))}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 line-clamp-2">{item?.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {stripHtml(item?.description || '').slice(0, 100) || 'Explore more insights.'}
                                    </p>
                                    <Link
                                        to={RouteBlogDetails(recSlug, item?.slug || item?._id)}
                                        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#6C5CE7]"
                                    >
                                        Keep reading
                                        <Bookmark size={14} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                    {!recommended.length && (
                        <div className="p-8 text-center text-gray-500 border border-gray-200 border-dashed rounded-3xl bg-white/70">
                            More suggestions appear once related posts are available.
                        </div>
                    )}
                </div>
            </section>

            <div className="h-6" />

            <SummaryModal
                isOpen={isSummaryOpen}
                onClose={closeSummary}
                summary={summary}
                summaryLoading={summaryLoading}
                summaryError={summaryError}
                onRefresh={() => fetchSummary(true)}
            />
        </div>
    );
};

export default BlogDetail;
