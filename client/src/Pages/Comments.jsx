import React, { useEffect, useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { RouteBlogDetails } from '@/helpers/RouteName'
import { Trash2, MessageSquare } from 'lucide-react'
import { showToast } from '@/helpers/showToast'
import Loading from '@/components/Loading'

const Comments = () => {
    const [comments, setComments] = useState([])
    const [deletingId, setDeletingId] = useState(null)
    const { data, loading } = useFetch(`${getEnv('VITE_API_BASE_URL')}/comment/get-all-comment`, {
        method: 'get',
        credentials: 'include',
    });

    useEffect(() => {
        if (data?.comments) {
            setComments(data.comments)
        }
    }, [data])

    const handleDeleteComment = async (commentId) => {
        if (!commentId || deletingId) return

        setDeletingId(commentId)
        try {
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/comment/delete/${commentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const result = await response.json().catch(() => ({}))
            
            if (response.ok) {
                setComments((prev) => prev.filter((comment) => comment._id !== commentId))
                showToast('success', result?.message || 'Comment deleted')
                window.dispatchEvent(new Event('refreshComments'))
            } else {
                showToast('error', result?.message || 'Failed to delete comment')
            }
        } catch (error) {
            showToast('error', error.message || 'Error deleting comment')
        } finally {
            setDeletingId(null)
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="px-4 sm:px-8 lg:px-12 pt-6 pb-16 text-gray-900 space-y-10">
            <section className="relative mt-4 overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-8 py-10 lg:px-12 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.85)]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/3" />
                <div className="absolute -bottom-24 -left-12 w-72 h-72 bg-purple-300/25 rounded-full blur-3xl" />
                <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
                    <div className="space-y-5 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">Dashboard • Comments</p>
                        <h1 className="text-4xl sm:text-5xl font-black leading-tight">All Comments</h1>
                        <p className="text-white/85 max-w-2xl text-sm sm:text-base">Keep an eye on every conversation, respond faster, and celebrate the most active threads in your community.</p>
                        <div className="flex flex-wrap gap-3">
                            <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-white/80">{comments.length} total</span>
                            <span className="rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-white/80">Real-time moderation</span>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 flex-1">
                        {[
                            {
                                label: "Comments",
                                value: comments.length,
                                helper: "all-time",
                            },
                            {
                                label: "Latest",
                                value: comments[0]?.createdAt ? moment(comments[0].createdAt).fromNow(true) : "—",
                                helper: "since last reply",
                            },
                            {
                                label: "Pending",
                                value: Math.max(comments.length - 5, 0),
                                helper: "need review",
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white/80 backdrop-blur"
                            >
                                <p className="uppercase text-[10px] tracking-[0.4em] text-white/70">{card.label}</p>
                                <p className="mt-2 text-3xl font-black text-white">{card.value ?? "—"}</p>
                                <p className="text-xs text-white/70">{card.helper}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                {comments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {comments.map((comment) => (
                            <div
                                key={comment._id}
                                className="group rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col gap-4"
                            >
                                <div className="space-y-3">
                                    <Link
                                        to={RouteBlogDetails(
                                            comment.blogid?.categories?.[0]?.slug || comment.blogid?.category?.slug || 'category',
                                            comment.blogid?.slug || comment.blogid?._id,
                                        )}
                                        className="text-lg font-semibold text-gray-900 hover:text-[#6C5CE7] transition"
                                    >
                                        {comment.blogid?.title || 'Untitled Blog'}
                                    </Link>
                                    <p className="text-sm leading-relaxed text-gray-600 line-clamp-4">{comment.comment}</p>
                                </div>

                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400">
                                    <span>{moment(comment.createdAt).fromNow()}</span>
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete comment"
                                        disabled={deletingId === comment._id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
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
    )
}

export default Comments