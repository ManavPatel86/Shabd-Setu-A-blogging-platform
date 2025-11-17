import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getEnv } from '@/helpers/getEnv'
import { showToast } from '@/helpers/showToast'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Textarea } from "@/components/ui/textarea"
import { useFetch } from '@/hooks/useFetch'
import Loading from '@/components/Loading'
import { IoCameraOutline } from "react-icons/io5";
import Dropzone from 'react-dropzone'
import { setUser } from '@/redux/user/user.slice'
import defaultAvatar from '@/assets/images/user.png'
import ActivityHeatmap from '@/components/ActivityHeatmap'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { RouteBlog, RouteBlogAdd, RouteBlogDetails, RouteProfileView } from '@/helpers/RouteName'
import { BookOpen, Eye, Heart, Sparkles, Tag, UserPlus, Users } from 'lucide-react'
import { getDisplayName } from '@/utils/functions'


const Profile = () => {

    const [filePreview, setPreview] = useState()
    const [file, setFile] = useState()
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
    const [twoFactorStatusLoading, setTwoFactorStatusLoading] = useState(true)
    const [twoFactorAction, setTwoFactorAction] = useState(null)
    const [twoFactorCode, setTwoFactorCode] = useState("")
    const [twoFactorRequestLoading, setTwoFactorRequestLoading] = useState(false)
    const [twoFactorConfirmLoading, setTwoFactorConfirmLoading] = useState(false)
    const [twoFactorEmailMask, setTwoFactorEmailMask] = useState("")
    const [copiedUsername, setCopiedUsername] = useState(false)
    const user = useSelector((state) => state.user)
    const apiBaseUrl = useMemo(() => getEnv('VITE_API_BASE_URL'), [])

    const userId = user?.user?._id
    const userDetailsUrl = userId ? `${getEnv('VITE_API_BASE_URL')}/user/get-user/${userId}` : null

    const { data: userData, loading: userLoading, error: userError } = useFetch(userDetailsUrl,
        { method: 'get', credentials: 'include' },
        [userDetailsUrl]
    )


    const contributionsUrl = userId ? `${getEnv('VITE_API_BASE_URL')}/user/contributions/${userId}` : null
    const profileOverviewUrl = userId ? `${getEnv('VITE_API_BASE_URL')}/user/profile-overview/${userId}` : null

    const {
        data: contributionsData,
        loading: contributionsLoading,
        error: contributionsError
    } = useFetch(contributionsUrl,
        { method: 'get', credentials: 'include' },
        [contributionsUrl]
    )

    const {
        data: overviewData,
        loading: overviewLoading,
        error: overviewError
    } = useFetch(profileOverviewUrl,
        { method: 'get', credentials: 'include' },
        [profileOverviewUrl]
    )


    const dispath = useDispatch()

    const formSchema = z.object({
        name: z.string()
            .max(60, 'Name can be at most 60 characters long.')
            .refine((value) => value.trim().length === 0 || value.trim().length >= 3, {
                message: 'Enter at least 3 characters for your name or leave it blank.',
            }),
        email: z.string().email(),
        bio: z.string()
            .max(500, 'Bio can be at most 500 characters long.')
            .refine((value) => value.trim().length === 0 || value.trim().length >= 3, {
                message: 'Enter at least 3 characters for your bio or leave it blank.',
            }),
        password: z.string().refine((val) => val === '' || val.length >= 8, {
            message: 'Password must be at least 8 characters long or leave empty'
        })

    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            bio: '',
            password: '',
        },
    })

    useEffect(() => {
        if (userData && userData.success) {
            form.reset({
                name: userData.user.name || '',
                email: userData.user.email || '',
                bio: userData.user.bio || '',
                password: '',

            })
        }
    }, [userData, form])

    useEffect(() => {
        if (!userId) return

        const fetchTwoFactorStatus = async () => {
            setTwoFactorStatusLoading(true)
            try {
                const response = await fetch(`${apiBaseUrl}/auth/two-factor/status`, {
                    method: 'GET',
                    credentials: 'include'
                })
                const data = await response.json()
                if (!response.ok) {
                    throw new Error(data.message || 'Unable to fetch two-step verification status.')
                }
                setTwoFactorEnabled(Boolean(data?.data?.enabled))
                setTwoFactorEmailMask(data?.data?.email || '')
            } catch (error) {
                showToast('error', error.message)
            } finally {
                setTwoFactorStatusLoading(false)
            }
        }

        fetchTwoFactorStatus()
    }, [apiBaseUrl, userId])



    const startTwoFactorChange = async (action) => {
        if (!userId) {
            return showToast('error', 'Sign in again to update security settings.')
        }
        setTwoFactorRequestLoading(true)
        try {
            const response = await fetch(`${apiBaseUrl}/auth/two-factor/start`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            const data = await response.json()
            if (!response.ok) {
                return showToast('error', data.message)
            }
            setTwoFactorAction(action)
            setTwoFactorCode("")
            if (data?.data?.email) {
                setTwoFactorEmailMask(data.data.email)
            }
            showToast('info', data.message || 'Enter the verification code we emailed you to continue.')
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setTwoFactorRequestLoading(false)
        }
    }

    const confirmTwoFactorChange = async () => {
        if (!twoFactorAction) {
            return showToast('error', 'No security change is pending confirmation.')
        }
        if (!twoFactorCode.trim()) {
            return showToast('error', 'Enter the verification code from your email.')
        }

        setTwoFactorConfirmLoading(true)
        try {
            const response = await fetch(`${apiBaseUrl}/auth/two-factor/confirm`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: twoFactorAction, code: twoFactorCode })
            })
            const data = await response.json()
            if (!response.ok) {
                return showToast('error', data.message)
            }

            const enabled = data?.data?.enabled ?? (twoFactorAction === 'enable')
            setTwoFactorEnabled(enabled)
            setTwoFactorAction(null)
            setTwoFactorCode("")
            if (data?.user) {
                dispath(setUser(data.user))
            }
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setTwoFactorConfirmLoading(false)
        }
    }

    const cancelTwoFactorFlow = () => {
        setTwoFactorAction(null)
        setTwoFactorCode("")
    }


    async function onSubmit(values) {
        try {
            const formData = new FormData()
            if (file) {
                formData.append('file', file)
            }

            const sanitizedData = {
                name: values.name.trim(),
                email: values.email.trim().toLowerCase(),
                bio: values.bio.trim(),
                password: values.password,
            }

            formData.append('data', JSON.stringify(sanitizedData))

            const targetUserId = userData?.user?._id || userId
            if (!targetUserId) {
                return showToast('error', 'User details not loaded yet. Please try again in a moment.')
            }

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/user/update-user/${targetUserId}`, {
                method: 'put',
                credentials: 'include',
                body: formData
            })
            const data = await response.json()
            if (!response.ok) {
                return showToast('error', data.message)
            }
            dispath(setUser(data.user))
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        }
    }

    const handleFileSelection = (files) => {
        if (!files || files.length === 0) {
            return
        }
        const [incomingFile] = files
        if (!incomingFile) {
            return
        }
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
        }
        const preview = URL.createObjectURL(incomingFile)
        setFile(incomingFile)
        setPreview(preview)
    }

    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview)
            }
        }
    }, [filePreview])

    const handleCopyUsername = async (username) => {
        if (!username) {
            return showToast('error', 'No username available to copy yet.')
        }
        try {
            if (!navigator?.clipboard) {
                throw new Error('Clipboard access is unavailable')
            }
            await navigator.clipboard.writeText(`@${username}`)
            setCopiedUsername(true)
            showToast('success', 'Username copied to clipboard')
            setTimeout(() => setCopiedUsername(false), 1500)
        } catch (error) {
            showToast('error', error.message || 'Unable to copy username right now.')
        }
    }

    if (userLoading) return <Loading />

    if (userError) {
        return (
            <div className="mx-auto flex max-w-screen-md flex-col items-center gap-4 py-16 text-center">
                <p className="text-lg font-semibold">We couldn&apos;t load your profile settings.</p>
                <p className="max-w-md text-sm text-muted-foreground">
                    Please refresh the page or try again later. If the issue persists, contact support.
                </p>
            </div>
        )
    }

    const showHeatmap = !contributionsLoading && !contributionsError && contributionsData
    const stats = overviewData?.stats || {}
    const highlights = overviewData?.highlights || {}
    const recentPosts = overviewData?.recentPosts || []
    const profileUser = overviewData?.user || userData?.user || {}
    const hasCustomName = Boolean(profileUser?.name?.trim())
    const displayHeading = hasCustomName ? profileUser.name : getDisplayName(profileUser)
    const usernameHandle = profileUser?.username ? `@${profileUser.username}` : ''

    const joinedDate = profileUser?.createdAt ? new Date(profileUser.createdAt) : null

    const formatNumber = (value) => {
        const numericValue = typeof value === 'number' ? value : Number(value) || 0
        return numericValue.toLocaleString()
    }

    const statsItems = [
        {
            label: 'Total posts',
            value: stats.totalPosts,
            helper: 'stories shared',
            icon: BookOpen,
            accent: 'from-white/40 via-white/15 to-white/0',
            tone: 'text-slate-900'
        },
        {
            label: 'Total views',
            value: stats.totalViews,
            helper: 'lifetime reads',
            icon: Eye,
            accent: 'from-purple-50 via-white to-white',
            tone: 'text-purple-900'
        },
        {
            label: 'Total likes',
            value: stats.totalLikes,
            helper: 'applause received',
            icon: Heart,
            accent: 'from-rose-50 via-white to-white',
            tone: 'text-rose-900'
        },
        {
            label: 'Followers',
            value: stats.followersCount,
            helper: 'people tuned in',
            icon: Users,
            accent: 'from-emerald-50 via-white to-white',
            tone: 'text-emerald-900'
        },
        {
            label: 'Following',
            value: stats.followingCount,
            helper: 'voices you follow',
            icon: UserPlus,
            accent: 'from-indigo-50 via-white to-white',
            tone: 'text-indigo-900'
        }
    ]

    const topCategories = highlights?.topCategories || []
    const topPost = highlights?.topPost
    const totalBlogsThisPeriod = contributionsData?.totalBlogs ?? 0
    const heroBio = profileUser?.bio?.trim() || 'Add a short bio to let readers know what you write about.'
    const topicsPreview = topCategories.slice(0, 3)

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:px-12">
            <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] px-6 py-10 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] sm:px-10">
                <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-12 h-64 w-64 translate-y-1/2 rounded-full bg-purple-300/40 blur-3xl" />
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="relative">
                            <div className="absolute inset-0 -translate-y-2 translate-x-2 rounded-full bg-white/25 blur-2xl" />
                            <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl">
                                <AvatarImage src={profileUser?.avatar || defaultAvatar} alt={profileUser?.name} />
                                <AvatarFallback>
                                    {profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            {usernameHandle && (
                                <button
                                    type="button"
                                    onClick={() => handleCopyUsername(profileUser?.username)}
                                    className="absolute -bottom-3 left-1/2 w-max -translate-x-1/2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/80 transition hover:bg-white/25"
                                >
                                    {copiedUsername ? 'Copied' : usernameHandle}
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 text-white">
                            <div className="space-y-3">
                                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                                    <Sparkles className="h-4 w-4" />
                                    Creator cockpit
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                                        {displayHeading || 'Your profile'}
                                    </h1>
                                    {profileUser?.role && (
                                        <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/80">
                                            {profileUser.role}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/85 sm:text-base">{heroBio}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.35em] text-white/75">
                                {joinedDate && (
                                    <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                                        Member since {joinedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                                {stats.totalPosts ? (
                                    <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                                        {formatNumber(stats.totalPosts)} posts
                                    </span>
                                ) : null}
                                {topicsPreview.length > 0 && (
                                    <span className="rounded-full border border-white/25 bg-white/10 px-4 py-1">
                                        Top topic · {topicsPreview[0].name}
                                    </span>
                                )}
                            </div>
                            {topicsPreview.length > 1 && (
                                <div className="flex flex-wrap gap-2 text-xs text-white/80">
                                    {topicsPreview.slice(1).map((topic) => (
                                        <span key={topic.slug || topic.name} className="rounded-full border border-white/30 bg-white/10 px-3 py-1">
                                            {topic.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                        <div className="rounded-[28px] border border-white/25 bg-white/10 px-8 py-6 text-center shadow-[0_20px_60px_-35px_rgba(15,23,42,0.8)]">
                            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Publishing streak</p>
                            <p className="text-4xl font-black text-white">{totalBlogsThisPeriod}</p>
                            <p className="text-xs text-white/70">blogs this period</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-[#6C5CE7] shadow-[0_20px_60px_-45px_rgba(15,23,42,0.8)] transition hover:bg-white">
                                <Link to={RouteBlogAdd}>Write a new blog</Link>
                            </Button>
                            <Button asChild variant="ghost" className="rounded-full border border-white/40 px-6 py-2 text-sm text-white hover:bg-white/10">
                                <Link to={RouteProfileView(profileUser?._id)}>View public profile</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Creator pulse</p>
                        <h2 className="text-2xl font-semibold text-slate-900">At a glance</h2>
                    </div>
                    {overviewLoading && <span className="text-xs text-slate-500">Syncing metrics...</span>}
                </div>
                {overviewLoading && !overviewData ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Skeleton key={`stats-skeleton-${index}`} className="h-28 rounded-3xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {statsItems.map((item) => (
                            <div
                                key={item.label}
                                className={`rounded-3xl border border-slate-100 bg-gradient-to-br ${item.accent} px-5 py-4 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.8)]`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-10 w-10 text-[#6C5CE7]" />
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">{item.label}</p>
                                        <p className={`text-3xl font-black ${item.tone}`}>{formatNumber(item.value)}</p>
                                        <p className="text-sm text-slate-500">{item.helper}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {overviewError && (
                    <p className="text-xs text-rose-500">We couldn&apos;t load your performance data right now.</p>
                )}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Top performing blog</p>
                            <h3 className="text-xl font-semibold text-slate-900">Audience favorite</h3>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">Lifetime</span>
                    </div>
                    {overviewLoading && !topPost ? (
                        <Skeleton className="h-28 rounded-3xl" />
                    ) : topPost ? (
                        <div className="space-y-2">
                            <h4 className="text-lg font-semibold text-slate-900">{topPost.title}</h4>
                            <p className="text-xs text-slate-500">
                                {new Date(topPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                {topPost?.category?.name ? ` · ${topPost.category.name}` : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span>{formatNumber(topPost.views)} views</span>
                                <span>{formatNumber(topPost.likeCount)} likes</span>
                            </div>
                            <Button asChild variant="ghost" className="w-fit rounded-full px-4 text-sm text-[#6C5CE7] hover:bg-[#6C5CE7]/10">
                                <Link to={topPost?.category?.slug && topPost?.slug ? RouteBlogDetails(topPost.category.slug, topPost.slug) : RouteBlog}>
                                    Open Blog
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Publish a post to start building your highlights.</p>
                    )}
                </div>

                <div className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#6C5CE7]">
                            <Tag className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Top categories</p>
                            <h3 className="text-xl font-semibold text-slate-900">Themes you explore</h3>
                        </div>
                    </div>
                    {overviewLoading && topCategories.length === 0 ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 rounded" />
                            <Skeleton className="h-6 rounded" />
                            <Skeleton className="h-6 rounded" />
                        </div>
                    ) : topCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {topCategories.map((category) => (
                                <span
                                    key={category.slug || category.name}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700"
                                >
                                    {category.name}
                                    <span className="text-slate-500"> · {category.count} posts</span>
                                    {category.percentage ? (
                                        <span className="text-slate-500"> ({category.percentage}%)</span>
                                    ) : null}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Your published posts will reveal your top categories here.</p>
                    )}
                </div>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-6">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Account settings</p>
                    <h2 className="text-2xl font-semibold text-slate-900">Personalize your profile</h2>
                    <p className="text-sm text-slate-500">Update your details and avatar to keep your public page on-brand.</p>
                </div>
                <div className="flex justify-center">
                    <Dropzone onDrop={(acceptedFiles) => handleFileSelection(acceptedFiles)}>
                        {({ getRootProps, getInputProps }) => (
                            <div {...getRootProps()} className="group inline-block">
                                <input {...getInputProps()} />
                                <Avatar className="relative h-28 w-28">
                                    <AvatarImage src={filePreview ? filePreview : (userData?.user?.avatar || defaultAvatar)} />
                                    <AvatarFallback>{profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                    <div className="absolute inset-0 z-10 hidden items-center justify-center rounded-full border-2 border-white/60 bg-black/30 backdrop-blur-sm group-hover:flex">
                                        <IoCameraOutline color='#7c3aed' />
                                    </div>
                                </Avatar>
                            </div>
                        )}
                    </Dropzone>
                </div>
                {usernameHandle && (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm">
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Username</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <code className="text-lg font-semibold text-slate-900">{usernameHandle}</code>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleCopyUsername(profileUser?.username)}>
                                {copiedUsername ? 'Copied' : 'Copy handle'}
                            </Button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            Usernames are unique identifiers and cannot be changed at the moment.
                        </p>
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        Display name
                                        <span className="text-xs font-normal text-slate-400">optional</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Add a name readers will see"
                                            maxLength={60}
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-slate-400">If left blank we&apos;ll show your username instead.</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter your email address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        Bio
                                        <span className="text-xs font-normal text-slate-400">optional</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell readers a little about yourself"
                                            rows={4}
                                            maxLength={500}
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span>Share what you love to write about.</span>
                                        <span>{(field.value?.length ?? 0)}/500</span>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        New password
                                        <span className="text-xs font-normal text-slate-400">optional</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Leave blank to keep your current password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">Save changes</Button>
                    </form>
                </Form>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Recent blogs</p>
                        <h2 className="text-2xl font-semibold text-slate-900">Keep tabs on performance</h2>
                    </div>
                    {recentPosts.length > 0 && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                            {recentPosts.length} active
                        </span>
                    )}
                </div>
                {overviewLoading && !overviewData ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={`recent-post-skeleton-${index}`} className="h-20 rounded-3xl" />
                        ))}
                    </div>
                ) : recentPosts.length > 0 ? (
                    <div className="space-y-4">
                        {recentPosts.map((post) => (
                            <div key={post._id || post.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                            <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            {post?.category?.name && <span>· {post.category.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <span>{formatNumber(post.views)} views</span>
                                        <span>{formatNumber(post.likeCount)} likes</span>
                                        <Button asChild variant="outline" size="sm" className="rounded-full">
                                            <Link to={post?.category?.slug && post?.slug ? RouteBlogDetails(post.category.slug, post.slug) : RouteBlog}>View</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Publish your first post to see it listed here.</p>
                )}
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Publishing activity</p>
                    <h2 className="text-2xl font-semibold text-slate-900">Consistency tracker</h2>
                    <p className="text-sm text-slate-500">Monitor your streak and fill the calendar with new ideas.</p>
                </div>
                {contributionsLoading && (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                        Loading activity...
                    </div>
                )}

                {contributionsError && (
                    <div className="rounded-md border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                        Unable to load your activity heatmap right now. Please refresh the page to try again.
                    </div>
                )}

                {showHeatmap && (
                    <div className="space-y-4">
                        {contributionsData.totalBlogs === 0 && (
                            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                You have not published any posts in this period yet. Create a blog to start filling your activity chart.
                            </div>
                        )}
                        <ActivityHeatmap
                            contributions={contributionsData.contributions}
                            totalBlogs={contributionsData.totalBlogs}
                            range={contributionsData.range}
                        />
                    </div>
                )}
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Security</p>
                        <h2 className="text-2xl font-semibold text-slate-900">Two-step verification</h2>
                        <p className="text-sm text-slate-500">Add an extra layer of protection to keep your writing safe.</p>
                    </div>
                    {!twoFactorStatusLoading && (
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${twoFactorEnabled ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>
                            {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    )}
                </div>
                {twoFactorStatusLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 rounded-3xl" />
                        <Skeleton className="h-12 rounded-3xl" />
                    </div>
                ) : (
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-[0_20px_60px_-55px_rgba(15,23,42,0.6)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <p className="text-base font-semibold text-slate-900">Two-step verification is {twoFactorEnabled ? 'on' : 'off'}</p>
                                <p className="text-sm text-slate-500">
                                    {twoFactorEnabled
                                        ? `We email verification codes to ${twoFactorEmailMask || 'your primary email'} when you sign in on new devices.`
                                        : 'Turn this on to require a verification code whenever you sign in from a new device.'}
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => startTwoFactorChange(twoFactorEnabled ? 'disable' : 'enable')}
                                disabled={twoFactorRequestLoading}
                                className="w-full rounded-full sm:w-auto"
                            >
                                {twoFactorRequestLoading ? 'Sending code...' : (twoFactorEnabled ? 'Turn off 2FA' : 'Turn on 2FA')}
                            </Button>
                        </div>
                    </div>
                )}

                {twoFactorAction && (
                    <div className="rounded-3xl border border-dashed border-[#6C5CE7]/30 bg-[#6C5CE7]/5 p-5 space-y-3">
                        <p className="text-sm font-medium text-[#6C5CE7]">
                            Enter the verification code we emailed you to confirm you want to {twoFactorAction === 'enable' ? 'turn on' : 'turn off'} two-step verification.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                placeholder="6-digit code"
                                maxLength={6}
                            />
                            <Button type="button" onClick={confirmTwoFactorChange} disabled={twoFactorConfirmLoading}>
                                {twoFactorConfirmLoading ? 'Verifying...' : 'Confirm'}
                            </Button>
                            <Button type="button" variant="outline" onClick={cancelTwoFactorFlow} disabled={twoFactorConfirmLoading}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Profile