import { getEnv } from '@/helpers/getEnv'
import { useFetch } from '@/hooks/useFetch'
import React, { useEffect, useState } from 'react'
import { Avatar } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import usericon from '@/assets/images/user.png'
import moment from 'moment'

const CommentList = ({ blogId }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    
    useEffect(() => {
        const handleRefresh = () => setRefreshKey(k => k + 1);
        window.addEventListener('refreshComments', handleRefresh);
        return () => window.removeEventListener('refreshComments', handleRefresh);
    }, []);

    const { data, loading } = useFetch(`${getEnv('VITE_API_BASE_URL')}/comment/get/${blogId}`, {
        method: 'get',
        credentials: 'include',
    }, [refreshKey]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            {data?.comments?.length > 0 ? (
                data.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2 mb-4">
                        <Avatar>
                            <AvatarImage src={comment.user?.avatar || usericon} />
                        </Avatar>
                        <div>
                            <p className="font-bold">{comment.user?.name}</p>
                            <p className="text-sm text-gray-500">{moment(comment.createdAt).fromNow()}</p>
                            <div className="pt-2">{comment.comment}</div>
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