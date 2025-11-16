import { Button } from '@/components/ui/button'
import { RouteAddCategory, RouteEditCategory } from '@/helpers/RouteName'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import Loading from '@/components/Loading'
import { FiEdit } from "react-icons/fi";
import { FaRegTrashAlt } from "react-icons/fa";
import { deleteData } from '@/helpers/handleDelete'
import { showToast } from '@/helpers/showToast'

const CategoryDetails = () => {

    const [refreshData, setRefreshData] = useState(false);

    const { data: categoryData, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/category/all-category`, {
        method: 'get',
        credentials: 'include'
    }, [refreshData])

    const handleDelete = (id) => {
        const response = deleteData(`${getEnv('VITE_API_BASE_URL')}/category/delete/${id}`)
        if (response) {
            setRefreshData(!refreshData)
            showToast('success', 'Data deleted.')
        } else {
            showToast('error', 'Data not deleted.')
        }
    }

    if (loading) return <Loading />

    const categories = categoryData?.category || [];

    return (
        <div className="w-full pt-4">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
                        </div>
                        <p className="text-gray-600 text-sm ml-8">Organize and manage blog categories for your platform</p>
                    </div>
                    <Button
                        asChild
                        className="rounded-lg bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 font-medium flex items-center gap-2"
                    >
                        <Link to={RouteAddCategory}>
                            <span className="text-lg">+</span>
                            Add Category
                        </Link>
                    </Button>
                </div>

                {/* Stats Badges */}
                <div className="flex gap-3">
                    <span className="inline-block px-3 py-1 rounded-full border-2 border-gray-300 text-gray-700 text-xs font-semibold bg-white">
                        {categories.length} Total Categories
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full border-2 border-gray-300 text-gray-700 text-xs font-semibold bg-white">
                        {categories.length} Showing
                    </span>
                </div>
            </div>

            {/* Categories Grid */}
            {categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => {
                        // Extract emoji from the start of category name
                        const emojiMatch = category.name.match(/^(\p{Emoji})\s/u);
                        const emoji = emojiMatch ? emojiMatch[1] : '📁';
                        const nameWithoutEmoji = emojiMatch ? category.name.substring(emojiMatch[0].length) : category.name;

                        return (
                            <div
                                key={category._id}
                                className="border-2 border-gray-300 rounded-2xl p-6 bg-white hover:shadow-lg transition-shadow"
                            >
                                {/* Icon and Category Name */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">
                                        {emoji}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{nameWithoutEmoji}</h3>
                                        <p className="text-gray-500 text-sm">Travel guides and experiences</p>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200 my-4"></div>

                                {/* Posts Count and Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-500 font-bold text-lg">1234</span>
                                        <span className="text-gray-600 text-sm">posts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="hover:bg-gray-100 p-2 h-auto"
                                        >
                                            <Link to={RouteEditCategory(category._id)}>
                                                <FiEdit className="w-5 h-5 text-gray-600" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(category._id)}
                                            className="hover:bg-gray-100 p-2 h-auto"
                                        >
                                            <FaRegTrashAlt className="w-5 h-5 text-gray-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">No categories found.</p>
                    <p className="text-sm mt-2">Create your first category to get started.</p>
                </div>
            )}
        </div>
    )
}

export default CategoryDetails;
