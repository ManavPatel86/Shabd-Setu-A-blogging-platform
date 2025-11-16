import Comment from '@/components/Comment'
import CommentCount from '@/components/CommentCount'
import CommentList from '@/components/CommentList'
import LikeCount from '@/components/LikeCount'
import Loading from '@/components/Loading'
import RelatedBlog from '@/components/RelatedBlog'
import { Avatar } from '@/components/ui/avatar'
import { getEnv } from '@/helpers/getEnv'
import { useFetch } from '@/hooks/useFetch'
import { AvatarImage } from '@radix-ui/react-avatar'
import { decode } from 'entities'
import moment from 'moment'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import SaveButton from '@/components/SaveButton';
import ReportModal from '@/components/ReportModal';
import { Flag } from 'lucide-react';
import { useSelector } from 'react-redux';

const SingleBlogDetails = () => {
    const { blog, category } = useParams()

<<<<<<< HEAD
    const [reportOpen, setReportOpen] = useState(false);
    const user = useSelector((state) => state.user);

    const { data, loading } = useFetch(`${getEvn('VITE_API_BASE_URL')}/blog/${blog}`, {
=======
    const { data, loading } = useFetch(`${getEnv('VITE_API_BASE_URL')}/blog/get-blog/${blog}`, {
>>>>>>> 763c7a20c4142528f448b3e4cdf8944a70182823
        method: 'get',
        credentials: 'include',
    }, [blog, category])

    if (loading) return <Loading />
    return (

        <div className='md:flex-nowrap flex-wrap flex justify-between gap-20'>
            {data && data.blog &&
                <>
                    <div className='border rounded md:w-[70%] w-full p-5'>
                        <h1 className='text-2xl font-bold mb-5'>{data.blog.title}</h1>
                        <div className='flex justify-between items-center'>
                            <div className='flex justify-between items-center gap-5'>
                                <Avatar>
                                    <AvatarImage src={data.blog.author.avatar} />
                                </Avatar>
                                <div>
                                    <p className='font-bold'>{data.blog.author.name}</p>
                                    <p>Date: {moment(data.blog.createdAt).format('DD-MM-YYYY')}</p>
                                </div>
                            </div>
                            <div className='flex justify-between items-center gap-5'>
                                <LikeCount props={{ blogid: data.blog._id }} />
                                <CommentCount props={{ blogid: data.blog._id }} />
                                <SaveButton blogId={data.blog._id} size="sm" className="text-gray-600" />
                                {user && user.isLoggedIn && (
                                    <button
                                        onClick={e => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setReportOpen(true);
                                        }}
                                        className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-semibold cursor-pointer transition-colors"
                                        title="Report this blog"
                                    >
                                        <Flag className="h-4 w-4" /> Report
                                    </button>
                                )}
                                <ReportModal blogId={data.blog._id} open={reportOpen} onClose={() => setReportOpen(false)} />
                            </div>
                        </div>
                        <div className='my-5'>
                            <img src={data.blog.featuredImage} className='rounded' />
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: decode(data.blog.blogContent) || '' }}>

                        </div>

                        <div className='border-t mt-5 pt-5'>
                            <Comment props={{ blogid: data.blog._id }} />
                        </div>


                    </div>
                </>

            }
            <div className='border rounded md:w-[30%] w-full p-5'>
                <RelatedBlog category={category} currentBlog={blog} />
            </div>
        </div>
    )
}

export default SingleBlogDetails