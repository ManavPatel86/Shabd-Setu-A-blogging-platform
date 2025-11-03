import React from 'react'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import { Avatar } from '@/components/ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import usericon from '@/assets/images/user.png'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { RouteBlogDetails } from '@/helpers/RouteName'

const Comments = () => {
    const { data, loading } = useFetch(`${getEnv('VITE_API_BASE_URL')}/comment/get-all-comment`, {
        method: 'get',
        credentials: 'include',
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">All Comments</h1>
            <div className="space-y-6">
                {data?.comments?.length > 0 ? (
                    data.comments.map((comment) => (
                        <div key={comment._id} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex gap-2 mb-2">
                                <Avatar>
                                    <AvatarImage src={comment.user?.avatar || usericon} />
                                </Avatar>
                                <div>
                                    <p className="font-bold">{comment.user?.name}</p>
                                    <p className="text-sm text-gray-500">{moment(comment.createdAt).fromNow()}</p>
                                </div>
                            </div>
                            <div className="pl-10">
                                <p className="text-gray-700 mb-2">{comment.comment}</p>
                                <Link 
                                    to={RouteBlogDetails(comment.blogid?.category?.slug || 'category', comment.blogid?.slug || comment.blogid?._id)} 
                                    className="text-sm text-blue-500 hover:underline"
                                >
                                    View Blog: {comment.blogid?.title || 'Untitled Blog'}
                                </Link>
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