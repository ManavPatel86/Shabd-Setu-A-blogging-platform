import { getEnv } from '@/helpers/getEnv'
import { useFetch } from '@/hooks/useFetch'
import React, { useEffect, useState } from 'react'
import { Avatar } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import usericon from '@/assets/images/user.png'
import moment from 'moment'
import { Trash2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { showToast } from '@/helpers/showToast'

const CommentList = ({ blogid }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [comments, setComments] = useState([])
    const [deletingId, setDeletingId] = useState(null)
    const currentUser = useSelector((state) => state.user?.user)
    
    useEffect(() => {
        const handleRefresh = () => setRefreshKey(k => k + 1);
        window.addEventListener('refreshComments', handleRefresh);
        return () => window.removeEventListener('refreshComments', handleRefresh);
    }, []);

    const { data, loading } = useFetch(`${getEnv('VITE_API_BASE_URL')}/comment/get/${blogid}`, {
        method: 'get',
        credentials: 'include',
    }, [refreshKey]);

    useEffect(() => {
        if (data?.comments) {
            setComments(data.comments)
        } else {
            setComments([])
        }
    }, [data])

    const handleDeleteComment = async (commentId) => {
        if (!commentId || deletingId) return

        setDeletingId(commentId)
        try {
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/comment/delete/${commentId}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            const result = await response.json().catch(() => ({}))

            if (!response.ok) {
                showToast('error', result?.message || 'Failed to delete comment')
                return
            }

            setComments((prev) => prev.filter((comment) => comment._id !== commentId))
            showToast('success', result?.message || 'Comment deleted')
            window.dispatchEvent(new Event('refreshComments'))
        } catch (error) {
            showToast('error', error.message || 'Error deleting comment')
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            {comments.length > 0 ? (
                comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2 mb-4">
                        <Avatar>
                            <AvatarImage src={comment.user?.avatar || usericon} />
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-bold">{comment.user?.name}</p>
                                    <p className="text-sm text-gray-500">{moment(comment.createdAt).fromNow()}</p>
                                </div>
                                {currentUser?._id === comment.user?._id && (
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete comment"
                                        disabled={deletingId === comment._id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="pt-2 text-gray-700">{comment.comment}</div>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            )}
        </div>
    )
}

export default CommentList