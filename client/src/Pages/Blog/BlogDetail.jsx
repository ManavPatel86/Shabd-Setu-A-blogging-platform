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

const CategoryPill = ({ label }) => (
    <span className="bg-white/90 text-[#6C5CE7] border border-purple-100/70 px-4 py-1.5 rounded-2xl text-[11px] font-semibold tracking-wide shadow-sm">
        {label}
    </span>
);

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
        updatedAt,
        blogContent,
        content,
        summary: presetSummary,
        slug,
        recommendedPosts,
        relatedPosts,
        views,
        readingTime,
    } = blog;

    const categories = useMemo(() => {
        if (Array.isArray(categoriesFromApi) && categoriesFromApi.length) {
            return categoriesFromApi;
        }
        if (category) return Array.isArray(category) ? category : [category];
        return [];
    }, [categoriesFromApi, category]);

    const formattedDate = createdAt ? moment(createdAt).format('DD MMM, YYYY') : 'Recently';
    const readLength = readingTime || blog?.meta?.readingTime || '5 min read';
    const primaryCategorySlug = categories?.[0]?.slug || categories?.[0]?.name || 'category';
    const featuredUrl = featuredImage || bannerImage || '/placeholder.jpg';

    const recommended = useMemo(() => {
        const list = Array.isArray(recommendedPosts) && recommendedPosts.length
            ? recommendedPosts
            : Array.isArray(relatedPosts)
                ? relatedPosts
                : [];
        return list.slice(0, 3);
    }, [recommendedPosts, relatedPosts]);

    const getSafeContent = () => {
        const raw = blogContent || content || presetSummary || '';
        if (!raw) return [];
        try {
            const decoded = decode(raw);
            const blocks = decoded
                .split(/<(?:p|div|h[1-6]|li)[^>]*>/gi)
                .map((segment) => segment.replace(/<[^>]+>/g, '').trim())
                .filter(Boolean);
            return blocks;
        } catch (error) {
            return [raw];
        }
    };

    const fetchSummary = async (refresh = false) => {
        if (!_id) return;
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setSummaryLoading(true);
            setSummaryError('');

            const query = refresh ? '?refresh=true' : '';
            const response = await fetch(
                `${getEnv('VITE_API_BASE_URL')}/blog/summary/${_id}${query}`,
                { method: 'get', credentials: 'include', signal: controller.signal },
            );

            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result?.message || 'Failed to generate summary');

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
        if (!cachedSummary && !summaryLoading) fetchSummary(false);
        else setSummary(cachedSummary);
    };

    const closeSummary = () => setIsSummaryOpen(false);

    const handleShare = async () => {
        const url = `${window.location.origin}${RouteBlogDetails(primaryCategorySlug, slug || _id)}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title,
                    text: blog?.description?.replace(/<[^>]*>/g, '')?.slice(0, 120),
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

    const commentCount =
        typeof blog?.commentStats?.totalComments === 'number'
            ? blog.commentStats.totalComments
            : Array.isArray(blog?.comments)
                ? blog.comments.length
                : blog?.commentsCount || 0;

    const articleBlocks = getSafeContent();

    return (
        <div className="space-y-10 pb-12 text-gray-900">
            {/* Featured banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gray-200 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.5)]">
                <img
                    src={featuredUrl}
                    alt={title}
                    className="h-[360px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
                    <div className="flex flex-wrap gap-3">
                        {(categories.length ? categories : ['Uncategorized']).map((cat, idx) => (
                            <CategoryPill key={cat?._id || cat?.slug || idx} label={cat?.name || cat} />
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                </div>
            </section>

            {/* Author card */}
            <section className="rounded-3xl border border-gray-100 bg-white shadow-sm px-6 py-5 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                    <img
                        src={author?.avatar || '/default-avatar.png'}
                        alt={author?.name}
                        className="h-16 w-16 rounded-full border border-purple-100 object-cover"
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
                <div className="flex items-center gap-6 text-sm font-semibold text-gray-600">
                    <span className="flex items-center gap-2"><Clock size={16} className="text-[#6C5CE7]" />{formattedDate}</span>
                    <span className="flex items-center gap-2"><Sparkles size={16} className="text-[#6C5CE7]" />{readLength}</span>
                    <span className="flex items-center gap-2"><PenTool size={16} className="text-[#6C5CE7]" />
                        {typeof views === 'number' ? views : <ViewCount blogId={_id} addView />}
                    </span>
                </div>
            </section>

            {/* Content */}
            <section className="rounded-3xl border border-gray-100 bg-white shadow-sm p-8">
                <div className="prose prose-lg max-w-none text-gray-700">
                    {articleBlocks.length ? (
                        articleBlocks.map((block, index) => (
                            <p key={index} className="leading-relaxed text-[17px] text-gray-700 mb-6">
                                {block}
                            </p>
                        ))
                    ) : (
                        <p className="text-gray-400">No content available.</p>
                    )}
                </div>
            </section>

            {/* Action bar */}
            <section className="rounded-3xl border border-gray-100 bg-white shadow-sm p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                    <LikeCount blogid={_id} variant="clean" />
                    <button
                        type="button"
                        onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                    >
                        <MessageCircle size={16} /> {commentCount} Comments
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:shadow-lg"
                    >
                        <Share2 size={16} /> Share
                    </button>
                    <SaveButton
                        blogId={_id}
                        size="sm"
                        withLabel
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#6C5CE7] hover:text-[#6C5CE7]"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-gray-50/70 px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Smart summary</p>
                        <p className="text-xs text-gray-500">AI highlights and talking points for this story.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openSummary}
                        className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-[#6C5CE7] shadow-sm hover:shadow-md"
                    >
                        <Bot size={16} /> Generate summary
                    </button>
                </div>
            </section>

            {/* Recommended */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Recommended</p>
                        <h3 className="text-2xl font-bold text-gray-900">Continue reading</h3>
                    </div>
                    <Link to="/" className="text-sm font-semibold text-[#6C5CE7] hover:underline">See all</Link>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {(recommended.length ? recommended : []).map((item, idx) => {
                        const recCategories = Array.isArray(item?.categories) && item.categories.length
                            ? item.categories
                            : item?.category
                                ? [item.category]
                                : [];
                        const recSlug = recCategories?.[0]?.slug || recCategories?.[0]?.name || 'category';
                        return (
                            <div key={item?._id || idx} className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
                                <div className="h-40 overflow-hidden">
                                    <img src={item?.featuredImage || '/placeholder.jpg'} alt={item?.title} className="h-full w-full object-cover" />
                                </div>
                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    <div className="flex flex-wrap gap-2">
                                        {(recCategories.length ? recCategories : ['Uncategorized']).map((cat, cIdx) => (
                                            <CategoryPill key={cat?._id || cat?.slug || cIdx} label={cat?.name || cat} />
                                        ))}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 line-clamp-2">{item?.title}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2">{item?.description?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Explore more insights.'}</p>
                                    <Link
                                        to={RouteBlogDetails(recSlug, item?.slug || item?._id)}
                                        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#6C5CE7]"
                                    >
                                        Keep reading <Bookmark size={14} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                    {!recommended.length && (
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/70 p-8 text-center text-gray-500">
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
