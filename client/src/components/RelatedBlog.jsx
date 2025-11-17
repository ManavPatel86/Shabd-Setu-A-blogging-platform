import React, { useState } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import Loading from '@/components/Loading'
import { Link } from 'react-router-dom'
import { RouteBlogDetails, RouteBlog } from '@/helpers/RouteName'
import { useSelector } from 'react-redux'
import { IoClose } from "react-icons/io5";
import { getDisplayName } from '@/utils/functions'

const RelatedBlog = ({ category, currentBlog, onClose, hideCloseButton }) => {
  // category may be a slug or an array; prefer slug string
  const user = useSelector((state) => state.user)
  const isLoggedIn = user?.isLoggedIn
  const [collapsed, setCollapsed] = useState(false)

  const categorySlug = Array.isArray(category)
    ? (category[0]?.slug || category[0])
    : category

  // Choose endpoint:
  // - If logged in and a currentBlog provided => personalized related for that blog
  // - If logged in and no currentBlog => personalized home recommendations
  // - Otherwise fallback to category-based related posts or all blogs
  let url = null
  if (isLoggedIn) {
    if (currentBlog) {
      url = `${getEnv('VITE_API_BASE_URL')}/blog/get-personalized-related/${currentBlog}`
    } else {
      url = `${getEnv('VITE_API_BASE_URL')}/blog/get-personalized-home`
    }
  } else {
    if (categorySlug) {
      url = `${getEnv('VITE_API_BASE_URL')}/blog/get-related-blog/${categorySlug}/${currentBlog || ''}`
    } else {
      url = `${getEnv('VITE_API_BASE_URL')}/blog/blogs`
    }
  }

  const { data, loading, error } = useFetch(url, { method: 'get', credentials: 'include' }, [url, isLoggedIn])

  // API shape: { relatedBlog: [...] } or for /blog/blogs -> { blog: [...] }
  const related = data?.relatedBlog || data?.blog || data?.savedBlogs || []

  if (loading) return <Loading />

  if (error) {
    return (
      <div className="text-sm text-red-500">Unable to load related posts.</div>
    )
  }

  if (!related.length || collapsed) {
    return (
      <div className="text-sm text-muted-foreground flex items-center justify-between">
        <span>No related posts found.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!hideCloseButton && (
        <div className="flex justify-end">
          {/** Close button - call parent onClose if provided, otherwise collapse locally */}
          <button
            aria-label="Close recommendations"
            onClick={() => (typeof onClose === 'function' ? onClose() : setCollapsed(true))}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            <IoClose />
          </button>
        </div>
      )}
      {related.slice(0, 6).map((post) => {
        const authorName = getDisplayName(post?.author)
        return (
          <Link
            key={post._id}
            to={post?.categories && post.categories[0]?.slug && post.slug ? RouteBlogDetails(post.categories[0].slug, post.slug) : RouteBlog}
            className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-md"
          >
            <img src={post.featuredImage || ''} alt={post.title} className="w-16 h-12 object-cover rounded" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{post.title}</div>
              <div className="text-xs text-muted-foreground">{authorName}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default RelatedBlog
