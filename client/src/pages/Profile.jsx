import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
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
import { RouteBlog, RouteBlogAdd, RouteBlogDetails, RouteProfileView, RouteSignIn ,RouteAnalytics } from '@/helpers/RouteName'
import { BookOpen, Eye, Heart, Sparkles, Tag, UserPlus, Users } from 'lucide-react'
import { getDisplayName } from '@/utils/functions'
import { normalizeUsername, validateUsername, USERNAME_REQUIREMENTS_MESSAGE, USERNAME_RULES } from '@/helpers/usernameValidation'
import { validatePassword } from '@/helpers/passwordValidation'


const Profile = () => {
    const [filePreview, setPreview] = useState()
    const [file, setFile] = useState()
    const [copiedUsername, setCopiedUsername] = useState(false)
    const [isChangingUsername, setIsChangingUsername] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [usernameFeedback, setUsernameFeedback] = useState({
        state: 'idle',
        message: USERNAME_REQUIREMENTS_MESSAGE
    })
    const [currentUsername, setCurrentUsername] = useState('')
    const apiBaseUrl = useMemo(() => getEnv('VITE_API_BASE_URL'), [])

    const user = useSelector((state) => state.user)
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

    const formSchema = useMemo(() => z.object({
        name: z.string()
            .max(60, 'Name can be at most 60 characters long.')
            .refine((value) => value.trim().length === 0 || value.trim().length >= 3, {
                message: 'Enter at least 3 characters for your name or leave it blank.',
            }),
        username: z.string().optional(),
        bio: z.string()
            .max(500, 'Bio can be at most 500 characters long.')
            .refine((value) => value.trim().length === 0 || value.trim().length >= 3, {
                message: 'Enter at least 3 characters for your bio or leave it blank.',
            }),
        oldPassword: z.string().optional(),
        newPassword: z.string().optional(),
        confirmPassword: z.string().optional(),
    }).superRefine((values, ctx) => {
        if (isChangingUsername) {
            const usernameCheck = validateUsername(values.username)
            if (!usernameCheck.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['username'],
                    message: usernameCheck.message
                })
            } else {
                values.username = usernameCheck.username
            }
        }

        const wantsPasswordChange = Boolean(
            isChangingPassword || values.oldPassword || values.newPassword || values.confirmPassword
        )

        if (!wantsPasswordChange) {
            return
        }

        if (!values.oldPassword || values.oldPassword.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['oldPassword'],
                message: 'Enter your current password.'
            })
        }

        if (!values.newPassword || values.newPassword.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['newPassword'],
                message: 'Enter a new password.'
            })
        } else {
            const passwordCheck = validatePassword(values.newPassword)
            if (!passwordCheck.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['newPassword'],
                    message: passwordCheck.message
                })
            }

            if (values.oldPassword && values.oldPassword === values.newPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['newPassword'],
                    message: 'New password must be different from current password.'
                })
            }
        }

        if (!values.confirmPassword || values.confirmPassword.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['confirmPassword'],
                message: 'Confirm your new password.'
            })
        } else if (values.newPassword && values.confirmPassword !== values.newPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['confirmPassword'],
                message: 'Passwords do not match.'
            })
        }
    }), [isChangingPassword, isChangingUsername])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            username: '',
            bio: '',
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    const watchedUsername = form.watch('username')
    const usernameFeedbackClass = usernameFeedback.state === 'available'
        ? 'text-emerald-600'
        : usernameFeedback.state === 'unavailable' || usernameFeedback.state === 'error'
            ? 'text-rose-500'
            : usernameFeedback.state === 'checking'
                ? 'text-slate-500'
                : usernameFeedback.state === 'invalid'
                    ? 'text-amber-600'
                    : 'text-slate-400'

    useEffect(() => {
        if (userData && userData.success) {
            form.reset({
                name: userData.user.name || '',
                username: userData.user.username || '',
                bio: userData.user.bio || '',
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
            setCurrentUsername(normalizeUsername(userData.user.username || ''))
            setIsChangingUsername(false)
            setUsernameFeedback({ state: 'idle', message: USERNAME_REQUIREMENTS_MESSAGE })
            setIsChangingPassword(false)
        }
    }, [userData, form])




    async function onSubmit(values) {
        try {
            const formData = new FormData()
            if (file) {
                formData.append('file', file)
            }

            const sanitizedData = {
                name: values.name.trim(),
                bio: values.bio.trim(),
            }

            if (isChangingUsername) {
                const usernameCheck = validateUsername(values.username)
                if (!usernameCheck.isValid) {
                    return showToast('error', usernameCheck.message)
                }

                if (usernameFeedback.state === 'checking') {
                    return showToast('error', 'Please wait while we confirm that username.')
                }

                if (usernameFeedback.state === 'unavailable') {
                    return showToast('error', 'That username is already taken.')
                }

                sanitizedData.username = usernameCheck.username
            }

            if (isChangingPassword && values.newPassword) {
                sanitizedData.currentPassword = values.oldPassword || ''
                sanitizedData.password = values.newPassword
            }

            const existingEmail = userData?.user?.email || profileUser?.email
            if (existingEmail) {
                sanitizedData.email = existingEmail.trim().toLowerCase()
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
            if (sanitizedData.username) {
                setCurrentUsername(sanitizedData.username)
                setIsChangingUsername(false)
                form.setValue('username', sanitizedData.username)
                setUsernameFeedback({ state: 'current', message: 'This is your current username.' })
            }
            if (isChangingPassword) {
                setIsChangingPassword(false)
                form.setValue('oldPassword', '')
                form.setValue('newPassword', '')
                form.setValue('confirmPassword', '')
            }
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

    useEffect(() => {
        if (!overviewData?.user) {
            return
        }

        const normalized = normalizeUsername(overviewData.user.username || '')

        setCurrentUsername(normalized)

        if (!isChangingUsername) {
            form.setValue('username', overviewData.user.username || '')
            setUsernameFeedback({ state: normalized ? 'current' : 'idle', message: normalized ? 'This is your current username.' : USERNAME_REQUIREMENTS_MESSAGE })
        }
    }, [overviewData, form, isChangingUsername])

    useEffect(() => {
        if (!isChangingUsername) {
            setUsernameFeedback({
                state: currentUsername ? 'current' : 'idle',
                message: currentUsername ? 'This is your current username.' : USERNAME_REQUIREMENTS_MESSAGE
            })
            return
        }

        const normalized = normalizeUsername(watchedUsername || '')

        if (!normalized) {
            setUsernameFeedback({ state: 'invalid', message: USERNAME_REQUIREMENTS_MESSAGE })
            return
        }

        if (normalized === currentUsername) {
            setUsernameFeedback({ state: 'current', message: 'This matches your current username.' })
            return
        }

        if (
            normalized.length < USERNAME_RULES.MIN_LENGTH ||
            normalized.length > USERNAME_RULES.MAX_LENGTH ||
            !USERNAME_RULES.REGEX.test(normalized)
        ) {
            setUsernameFeedback({ state: 'invalid', message: USERNAME_REQUIREMENTS_MESSAGE })
            return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            setUsernameFeedback({ state: 'checking', message: 'Checking availability...' })

            try {
                const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/auth/username/check?username=${normalized}`, {
                    signal: controller.signal
                })
                const data = await response.json()

                if (!response.ok) {
                    setUsernameFeedback({ state: 'error', message: data.message || 'Unable to check username right now.' })
                    return
                }

                if (data?.data?.available || normalized === currentUsername) {
                    setUsernameFeedback({ state: 'available', message: 'Username is available.' })
                } else {
                    setUsernameFeedback({ state: 'unavailable', message: 'Username is already taken.' })
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return
                }
                setUsernameFeedback({ state: 'error', message: error.message || 'Unable to check username right now.' })
            }
        }, 500)

        return () => {
            controller.abort()
            clearTimeout(timeoutId)
        }
    }, [isChangingUsername, watchedUsername, currentUsername])

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

    const handleCancelPasswordChange = () => {
        setIsChangingPassword(false)
        form.setValue('oldPassword', '')
        form.setValue('newPassword', '')
        form.setValue('confirmPassword', '')
        form.clearErrors(['oldPassword', 'newPassword', 'confirmPassword'])
    }

    const handleCancelUsernameChange = () => {
        setIsChangingUsername(false)
        form.setValue('username', currentUsername)
        form.clearErrors('username')
        setUsernameFeedback({
            state: currentUsername ? 'current' : 'idle',
            message: currentUsername ? 'This is your current username.' : USERNAME_REQUIREMENTS_MESSAGE
        })
    }

    const findFirstErrorMessage = (errors) => {
        const visited = new Set()

        const traverse = (value) => {
            if (!value) {
                return null
            }

            if (typeof value === 'string') {
                return value.trim().length > 0 ? value : null
            }

            if (Array.isArray(value)) {
                for (const item of value) {
                    const nestedFromArray = traverse(item)
                    if (nestedFromArray) {
                        return nestedFromArray
                    }
                }
                return null
            }

            if (typeof value === 'object') {
                if (visited.has(value)) {
                    return null
                }
                visited.add(value)

                if (typeof value.message === 'string' && value.message.trim().length > 0) {
                    return value.message
                }

                if (value.types && typeof value.types === 'object') {
                    const fromTypes = traverse(Object.values(value.types))
                    if (fromTypes) {
                        return fromTypes
                    }
                }

                for (const nested of Object.values(value)) {
                    const nestedMessage = traverse(nested)
                    if (nestedMessage) {
                        return nestedMessage
                    }
                }
            }

            return null
        }

        return traverse(errors)
    }

    const handleFormErrors = (errors) => {
        const message = findFirstErrorMessage(errors) || 'Please review the form and try again.'
        showToast('error', message)
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
    const publishedRecentPosts = recentPosts.filter((post) => (post?.status || 'published') !== 'draft')
    const profileUser = overviewData?.user || userData?.user || user?.user || {}
    const effectiveUsername = profileUser?.username || currentUsername || ''
    const hasCustomName = Boolean(profileUser?.name?.trim())
    const displayHeading = hasCustomName ? profileUser.name : getDisplayName(profileUser)
    const usernameHandle = effectiveUsername ? `@${effectiveUsername}` : ''

    const joinedDate = profileUser?.createdAt ? new Date(profileUser.createdAt) : null

    const formatNumber = (value) => {
        const numericValue = typeof value === 'number' ? value : Number(value) || 0
        return numericValue.toLocaleString()
    }

    const getPrimaryCategory = (entry) => {
        if (!entry || !Array.isArray(entry.categories)) {
            return null
        }

        return entry.categories.find((category) => category?.slug) || entry.categories[0] || null
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
    const topPostPrimaryCategory = topPost ? getPrimaryCategory(topPost) : null
    const totalBlogsThisPeriod = contributionsData?.totalBlogs ?? 0
    const heroBio = profileUser?.bio?.trim() || 'Add a short bio to let readers know what you write about.'
    const topicsPreview = topCategories.slice(0, 3)

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between">
                <BackButton className="mb-2 w-fit self-start rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-100/70 transition hover:bg-white hover:text-slate-900 sm:mb-4 sm:px-4 sm:py-2" />
            </div>
            <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] px-6 py-10 text-white shadow-[0_35px_80px_-45px_rgba(15,23,42,0.9)] sm:px-10">
                <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-12 h-64 w-64 translate-y-1/2 rounded-full bg-purple-300/40 blur-3xl" />
                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="relative flex flex-col items-center">
                            <div className="absolute inset-0 -translate-y-2 translate-x-2 rounded-full bg-white/25 blur-2xl" />
                            <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl">
                                <AvatarImage src={profileUser?.avatar || defaultAvatar} alt={profileUser?.name} />
                                <AvatarFallback>
                                    {profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            {usernameHandle && (
                                <div className="relative z-10 mt-4 w-max rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] lowercase tracking-[0.3em] text-white/85">
                                    {usernameHandle}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4 text-white">
                            <div className="space-y-3">
                                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                                    <Sparkles className="h-4 w-4" />
                                    Creator cockpit
                                </p>
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                                    <div>
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
                                        {profileUser?.email && (
                                            <p className="text-sm font-medium text-white/80">
                                                {profileUser.email}
                                            </p>
                                        )}
                                    </div>
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
                            <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">Published Blogs</p>
                            <p className="text-4xl font-black text-white">{totalBlogsThisPeriod}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-[#6C5CE7] shadow-[0_20px_60px_-45px_rgba(15,23,42,0.8)] transition hover:bg-white">
                                <Link to={RouteBlogAdd}>Write a new blog</Link>
                            </Button>
                            <Button asChild variant="ghost" className="rounded-full border border-white/40 px-6 py-2 text-sm text-white hover:bg-white/10">
                                <Link to={RouteProfileView(profileUser?._id)}>View public profile</Link>
                            </Button>
                            <Button asChild variant="ghost" className="rounded-full border border-white/40 px-6 py-2 text-sm text-white hover:bg-white/10">
                                <Link to={RouteAnalytics}>See your analytics</Link>
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
                                {topPostPrimaryCategory?.name ? ` · ${topPostPrimaryCategory.name}` : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span>{formatNumber(topPost.views)} views</span>
                                <span>{formatNumber(topPost.likeCount)} likes</span>
                            </div>
                            <Button asChild variant="ghost" className="w-fit rounded-full px-4 text-sm text-[#6C5CE7] hover:bg-[#6C5CE7]/10">
                                <Link to={topPostPrimaryCategory?.slug && topPost?.slug ? RouteBlogDetails(topPostPrimaryCategory.slug, topPost.slug) : RouteBlog}>
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, handleFormErrors)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <FormLabel className="text-sm font-semibold text-slate-700">Username</FormLabel>
                                            <p className="text-xs text-slate-500">Your public handle readers can use to find you.</p>
                                        </div>
                                        {isChangingUsername ? (
                                            <Button type="button" variant="ghost" size="sm" onClick={handleCancelUsernameChange}>
                                                Cancel
                                            </Button>
                                        ) : (
                                            <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingUsername(true)}>
                                                Change username
                                            </Button>
                                        )}
                                    </div>
                                    {isChangingUsername ? (
                                        <FormControl>
                                            <div className="relative mt-3">
                                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">@</span>
                                                <Input
                                                    className="w-full rounded-2xl border border-slate-200 bg-white pl-8 pr-4 py-2.5 text-slate-800 shadow-sm transition focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                                                    value={field.value || ''}
                                                    onChange={(event) => {
                                                        const raw = event.target.value || ''
                                                        const sanitized = normalizeUsername(raw)
                                                        field.onChange(sanitized)
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                    ) : (
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <code className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">
                                                @{field.value || currentUsername || 'username'}
                                            </code>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopyUsername(field.value || currentUsername)}
                                                disabled={!(field.value || currentUsername)}
                                            >
                                                {copiedUsername ? 'Copied' : 'Copy handle'}
                                            </Button>
                                        </div>
                                    )}
                                    <p className={`mt-2 text-xs ${isChangingUsername ? usernameFeedbackClass : 'text-slate-500'}`}>
                                        {isChangingUsername ? usernameFeedback.message : 'Handles must be unique and use lowercase letters, numbers, or underscores.'}
                                    </p>
                                </FormItem>
                            )}
                        />
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
                                </FormItem>
                            )}
                        />
                        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-1">
                                    <FormLabel className="text-sm font-semibold text-slate-700">Password</FormLabel>
                                    <p className="text-xs text-slate-500">Update your password when you need to change it.</p>
                                </div>
                                {isChangingPassword ? (
                                    <Button type="button" variant="ghost" size="sm" onClick={handleCancelPasswordChange}>
                                        Cancel
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                                        Change password
                                    </Button>
                                )}
                            </div>
                            {isChangingPassword ? (
                                <div className="mt-4 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="oldPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Enter your current password" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Create a strong new password" {...field} />
                                                </FormControl>
                                                <p className="text-xs text-slate-400">Use 8-64 characters with upper, lower, number, and special symbols.</p>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm new password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="Re-enter the new password" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ) : (
                                <p className="mt-3 text-xs text-slate-500">We&apos;ll ask for your current password before saving any changes.</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full sm:inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:from-[#6C5CE7] hover:to-[#6C5CE7]">Save changes</Button>
                    </form>
                </Form>
            </section>

            <section className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Recent blogs</p>
                        <h2 className="text-2xl font-semibold text-slate-900">Keep tabs on performance</h2>
                    </div>
                    {publishedRecentPosts.length > 0 && (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                            {publishedRecentPosts.length} active
                        </span>
                    )}
                </div>
                {overviewLoading && !overviewData ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={`recent-post-skeleton-${index}`} className="h-20 rounded-3xl" />
                        ))}
                    </div>
                ) : publishedRecentPosts.length > 0 ? (
                    <div className="space-y-4">
                        {publishedRecentPosts.map((post) => {
                            const primaryCategory = getPrimaryCategory(post)

                            return (
                                <div key={post._id || post.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                {primaryCategory?.name && <span>· {primaryCategory.name}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                            <span>{formatNumber(post.views)} views</span>
                                            <span>{formatNumber(post.likeCount)} likes</span>
                                            <Button asChild variant="outline" size="sm" className="rounded-full">
                                                <Link to={primaryCategory?.slug && post?.slug ? RouteBlogDetails(primaryCategory.slug, post.slug) : RouteBlog}>View</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
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
        </div>
    )
}

export default Profile