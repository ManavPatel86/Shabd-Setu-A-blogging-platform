import { getEnv } from '@/helpers/getEnv';
import { showToast } from '@/helpers/showToast';
import { useFetch } from '@/hooks/useFetch';
import React, { useEffect, useState } from 'react'
import { FaRegHeart } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { FaHeart } from "react-icons/fa";

const LikeCount = ({ props }) => {
    const [likeCount, setLikeCount] = useState(0)
    const [hasLiked, setHasLiked] = useState(false)
    const user = useSelector(state => state.user)

    const { data: blogLikeCount, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/bloglike/get-like/${props.blogid}/${user && user.isLoggedIn ? user.user._id : ''}`, {
        method: 'get',
        credentials: 'include',
    })
 
    useEffect(() => {
        if (blogLikeCount) {
            setLikeCount(blogLikeCount.likecount)
            setHasLiked(blogLikeCount.isUserliked)
        }
    }, [blogLikeCount])

    const handleLike = async () => {
        try {
            if (!user.isLoggedIn) {
                return showToast('error', 'Please login into your account.')
            }

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/bloglike/do-like`, {
                method: 'post',
                credentials: 'include',
                headers: { 'Content-type': "application/json" },
                body: JSON.stringify({ user: user.user._id, blogid: props.blogid })
            })

            if (!response.ok) {
                showToast('error', response.statusText)
            }
            const responseData = await response.json()
            setLikeCount(responseData.likecount)
            setHasLiked(!hasLiked)
        } catch (error) {
            showToast('error', error.message)
        }
    }

    return (
        <button onClick={handleLike} className="flex items-center gap-1 text-sm hover:text-red-500 transition">
            {hasLiked ? <FaHeart className="h-4 w-4 text-red-500" /> : <FaRegHeart className="h-4 w-4" />} 
            <span>{likeCount}</span>
        </button>
    )
}

export default LikeCount