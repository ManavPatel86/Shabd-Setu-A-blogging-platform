import React, { useEffect, useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { RouteBlogDetails } from '@/helpers/RouteName'
import { Trash2 } from 'lucide-react'
import { showToast } from '@/helpers/showToast'

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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">All Comments</h1>
            <div className="space-y-6">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment._id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-3">
                                <Link 
                                    to={RouteBlogDetails(
                                        comment.blogid?.categories?.[0]?.slug || comment.blogid?.category?.slug || 'category',
                                        comment.blogid?.slug || comment.blogid?._id
                                    )} 
                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                >
                                    {comment.blogid?.title || 'Untitled Blog'}
                                </Link>
                                <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete comment"
                                    disabled={deletingId === comment._id}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-700">{comment.comment}</p>
                                <p className="text-sm text-gray-500">{moment(comment.createdAt).fromNow()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center py-10 text-gray-500">No comments found.</p>
                )}
            </div>
        </div>
    )
}

export default Comments