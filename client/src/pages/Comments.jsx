import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Trash2, MessageSquare } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';
import { getEnv } from '@/helpers/getEnv';
import { RouteBlogDetails } from '@/helpers/RouteName';
import { showToast } from '@/helpers/showToast';
import Loading from '@/components/Loading';

const Comments = () => {
    const [comments, setComments] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    const commentsEndpoint = `${getEnv('VITE_API_BASE_URL')}/comment/get-all-comment`;

    const { data, loading, error } = useFetch(
        commentsEndpoint,
        {
            method: 'get',
            credentials: 'include',
        },
        [commentsEndpoint],
    );

    useEffect(() => {
        if (Array.isArray(data?.comments)) {
            setComments(data.comments);
        }
    }, [data]);

    const latestCommentDelta = useMemo(() => {
        if (!comments.length) return '—';
        return comments[0]?.createdAt ? moment(comments[0].createdAt).fromNow(true) : '—';
    }, [comments]);

    const handleDeleteComment = async (commentId) => {
        if (!commentId || deletingId) return;

        setDeletingId(commentId);
        try {
            const response = await fetch(
                `${getEnv('VITE_API_BASE_URL')}/comment/delete/${commentId}`,
                { method: 'delete', credentials: 'include' },
            );
            const result = await response.json().catch(() => ({}));

            if (response.ok) {
                setComments((prev) => prev.filter((comment) => comment._id !== commentId));
                showToast('success', result?.message || 'Comment deleted');
                window.dispatchEvent(new Event('refreshComments'));
            } else {
                showToast('error', result?.message || 'Failed to delete comment');
            }
        } catch (err) {
            showToast('error', err.message || 'Error deleting comment');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <Loading />;
    if (error) {
        return (
            <div className="px-4 py-6 text-center text-sm text-red-500">
                Error loading comments: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-10 px-4 pt-6 pb-16 text-gray-900 sm:px-8 lg:px-12">
            <section className="relative mt-4 overflow-hidden rounded-[40px] bg-[#6C5CE7] px-8 py-10 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.85)] lg:px-12">
                <div className="absolute right-0 top-0 h-80 w-80 translate-x-1/4 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full bg-purple-300/25 blur-3xl" />
                <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
                    <div className="flex-1 space-y-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
                            Dashboard • Comments
                        </p>
                        <h1 className="text-4xl font-black leading-tight sm:text-5xl">All Comments</h1>
                        <p className="max-w-2xl text-sm text-white/85 sm:text-base">
                            Keep an eye on every conversation, respond faster, and celebrate the most active threads in your community.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-white/80">
                                {comments.length} total
                            </span>
                        </div>
                    </div>
                    <div className="grid flex-1 gap-4 sm:grid-cols-2">
                        {[
                            { label: 'Comments', value: comments.length, helper: 'all-time' },
                            { label: 'Latest', value: latestCommentDelta, helper: 'since last reply' },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/80 backdrop-blur"
                            >
                                <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">{card.label}</p>
                                <p className="mt-2 text-3xl font-black text-white">{card.value ?? '—'}</p>
                                <p className="text-xs text-white/70">{card.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                {comments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {comments.map((comment) => {
                            const blogSlug =
                                comment.blogid?.categories?.[0]?.slug ||
                                comment.blogid?.category?.slug ||
                                'category';
                            const blogDetailSlug = comment.blogid?.slug || comment.blogid?._id;

                            return (
                                <div
                                    key={comment._id}
                                    className="group flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="space-y-3">
                                        <Link
                                            to={RouteBlogDetails(blogSlug, blogDetailSlug)}
                                            className="text-lg font-semibold text-gray-900 transition hover:text-[#6C5CE7]"
                                        >
                                            {comment.blogid?.title || 'Untitled Blog'}
                                        </Link>
                                        <p className="line-clamp-4 text-sm leading-relaxed text-gray-600">{comment.comment}</p>
                                    </div>

                                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400">
                                        <span>{moment(comment.createdAt).fromNow()}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Delete comment"
                                            disabled={deletingId === comment._id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-gray-300 bg-gray-50/80 px-10 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#6C5CE7]">
                            <MessageSquare size={22} />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">No comments yet</p>
                        <p className="text-sm text-gray-500">Your posts haven’t received user feedback.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Comments;