import { getEnv } from '@/helpers/getEnv';
import { showToast } from '@/helpers/showToast';
import { useFetch } from '@/hooks/useFetch';
import React, { useEffect, useState } from 'react'
import { FaRegHeart } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { FaHeart } from "react-icons/fa";

const LikeCount = ({ blogid, className = "", variant = "text" }) => {
    const [likeCount, setLikeCount] = useState(0)
    const [hasLiked, setHasLiked] = useState(false)
    const user = useSelector(state => state.user)

    const { data: blogLikeCount } = useFetch(`${getEnv('VITE_API_BASE_URL')}/bloglike/get-like/${blogid}/${user && user.isLoggedIn ? user.user._id : ''}`, {
        method: 'get',
        credentials: 'include',
    })
 
    useEffect(() => {
        if (blogLikeCount) {
            setLikeCount(blogLikeCount.likecount)
            setHasLiked(blogLikeCount.isUserliked)
        }
    }, [blogLikeCount])

    const handleLike = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            if (!user.isLoggedIn) {
                return showToast('error', 'Please login into your account.')
            }

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/bloglike/do-like`, {
                method: 'post',
                credentials: 'include',
                headers: { 'Content-type': "application/json" },
                body: JSON.stringify({ user: user.user._id, blogid })
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

    const baseButtonClasses = "flex items-center gap-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]/30";
    const variantClasses = (() => {
        if (variant === "pill") {
            return "px-4 py-2 rounded-2xl border border-gray-200 bg-white/90 shadow-sm hover:border-gray-300 hover:text-[#6C5CE7]";
        }
        if (variant === "clean") {
            return "px-4 py-2 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100";
        }
        if (variant === "chip") {
            return "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-[#6C5CE7] hover:text-[#6C5CE7]";
        }
        return "text-gray-600 hover:text-red-500";
    })();
    const iconBase = "h-4 w-4 transition-colors";
    const iconColor = hasLiked
        ? "text-[#6C5CE7]"
        : variant === "chip"
            ? "text-slate-400"
            : "text-gray-400";

    return (
        <button onClick={handleLike} className={`${baseButtonClasses} ${variantClasses} ${className}`}>
            {hasLiked ? (
                <FaHeart className={`${iconBase} ${iconColor}`} />
            ) : (
                <FaRegHeart className={`${iconBase} ${iconColor}`} />
            )}
            <span className={variant === "pill" ? "text-gray-900" : "text-current"}>{likeCount}</span>
            {variant === "pill" && (
                <span className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Appreciate</span>
            )}
        </button>
    )
}

export default LikeCount