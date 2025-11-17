import { Button } from '@/components/ui/button'
import { RouteAddCategory, RouteEditCategory } from '@/helpers/RouteName'
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import Loading from '@/components/Loading'
import { FiEdit } from "react-icons/fi";
import { FaRegTrashAlt } from "react-icons/fa";
import { deleteData } from '@/helpers/handleDelete'
import { showToast } from '@/helpers/showToast'
import { Sparkles, FolderKanban } from "lucide-react";

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

    const categories = useMemo(
        () => (Array.isArray(categoryData?.category) ? categoryData.category : []),
        [categoryData]
    );

    const extractCategoryVisuals = (name = "") => {
        if (!name) return { emoji: '📁', label: 'Untitled' };
        const emojiMatch = name.match(/^(\p{Extended_Pictographic})\s*(.*)$/u);
        if (emojiMatch) {
            return {
                emoji: emojiMatch[1],
                label: emojiMatch[2] ? emojiMatch[2].trim() : 'Untitled'
            };
        }
        return { emoji: '📁', label: name };
    };

    const getCategoryDescription = (category) => {
        return category?.description?.trim() || 'Keep this space updated so readers know what belongs here.';
    };

    const getPostCount = (category) => {
        const count = category?.blogCount ?? category?.postCount ?? category?.postsCount ?? category?.count ?? 0;
        return Number.isFinite(count) ? count : 0;
    };

    const totalPosts = useMemo(
        () => categories.reduce((sum, cat) => sum + getPostCount(cat), 0),
        [categories]
    );

    const stats = useMemo(() => [
        {
            label: 'Active categories',
            value: categories.length,
            helper: 'curated spaces'
        },
        {
            label: 'Mapped posts',
            value: totalPosts,
            helper: 'assigned entries'
        },
        {
            label: 'With descriptions',
            value: categories.filter((cat) => Boolean(cat?.description)).length,
            helper: 'context-ready'
        }
    ], [categories, totalPosts]);

    const accentPills = [
        'from-[#6C5CE7] via-[#7C6BEE] to-[#8B5CF6]',
        'from-[#F97316] via-[#FB923C] to-[#FDBA74]',
        'from-[#10B981] via-[#34D399] to-[#6EE7B7]',
        'from-[#3B82F6] via-[#60A5FA] to-[#93C5FD]'
    ];

    if (loading) return <Loading />

    return (
        <div className="max-w-8xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-6">
            {/* Header Section */}
            <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-6 sm:px-10 py-12 shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] mb-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-16 w-56 h-56 bg-purple-300/40 rounded-full blur-3xl translate-y-1/2" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-4 max-w-2xl">
                        <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                            <Sparkles className="h-4 w-4" />
                            Content taxonomy
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-black leading-tight">Manage Categories</h1>
                        <p className="text-white/80 text-base">
                            Shape the reading journey by curating categories that feel personal, organized, and on-brand.
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-white/75">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                                <FolderKanban className="h-4 w-4" />
                                {categories.length} active categories
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                                Mapped posts: {totalPosts}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button
                            asChild
                            className="rounded-full bg-white text-[#6C5CE7] hover:bg-white/90 font-semibold px-8 py-4 shadow-lg shadow-purple-400/40"
                        >
                            <Link to={RouteAddCategory}>
                                Create category
                            </Link>
                        </Button>
                        <p className="text-xs text-white/60 md:text-right">Need inspiration? Try grouping by intent, not topic.</p>
                    </div>
                </div>
            </section>

            {/* Stats Badges */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)]"
                    >
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                        <p className="text-sm text-slate-500">{stat.helper}</p>
                    </div>
                ))}
            </section>

            {/* Categories Grid */}
            {categories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {categories.map((category, index) => {
                        const { emoji, label } = extractCategoryVisuals(category?.name || '')
                        const postsCount = getPostCount(category)
                        const accent = accentPills[index % accentPills.length]

                        return (
                            <div
                                key={category._id}
                                className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] hover:-translate-y-1 transition-transform"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-2xl bg-linear-to-br ${accent} flex items-center justify-center text-2xl text-white shadow-lg`}>
                                            {emoji}
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Category</p>
                                            <h3 className="text-xl font-semibold text-slate-900">{label}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2">
                                                {getCategoryDescription(category)}
                                            </p>
                                        </div>
                                    </div>
                                    {category?.slug && (
                                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                                            {category.slug}
                                        </span>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 my-5" />

                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Posts</p>
                                        <p className="text-3xl font-black text-slate-900">{postsCount}</p>
                                        <p className="text-xs text-slate-500">linked stories</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="rounded-full border border-slate-200 hover:border-[#6C5CE7]/40"
                                        >
                                            <Link to={RouteEditCategory(category._id)} className="flex items-center gap-2">
                                                <FiEdit className="w-4 h-4 text-slate-600" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(category._id)}
                                            className="rounded-full border border-red-100 hover:border-red-200 text-red-500"
                                        >
                                            <FaRegTrashAlt className="w-4 h-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 rounded-4xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
                    <p className="text-lg font-semibold">No categories yet.</p>
                    <p className="text-sm mt-2">Spark inspiration by creating your first collection.</p>
                </div>
            )}
        </div>
    )
}

export default CategoryDetails;
