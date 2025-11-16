import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { BookOpen, Eye, Heart, UserPlus, Users } from 'lucide-react'
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
        { label: 'Total Posts', value: stats.totalPosts, icon: BookOpen },
        { label: 'Total Views', value: stats.totalViews, icon: Eye },
        { label: 'Total Likes', value: stats.totalLikes, icon: Heart },
        { label: 'Followers', value: stats.followersCount, icon: Users },
        { label: 'Following', value: stats.followingCount, icon: UserPlus }
    ]

    const topCategories = highlights?.topCategories || []
    const topPost = highlights?.topPost

    return (
        <div className="mx-auto flex max-w-screen-xl flex-col gap-6 pb-12">
            <Card>
                <CardContent className="flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start sm:gap-8">
                    <div className="flex flex-col items-center gap-4 text-center sm:w-64 sm:text-left">
                        <Avatar className="relative size-28">
                            <AvatarImage src={profileUser?.avatar || defaultAvatar} />
                        </Avatar>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-semibold">
                                    {displayHeading || 'Your profile'}
                                </h1>
                                {usernameHandle && (
                                    <p className="text-sm font-mono text-muted-foreground break-all">
                                        {usernameHandle}
                                    </p>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {profileUser?.bio || 'Add a short bio to let readers know what you write about.'}
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:justify-start">
                                {joinedDate && (
                                    <span>
                                        Member since {joinedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                                {profileUser?.role && (
                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                                        {profileUser.role}
                                    </span>
                                )}
                                {stats.totalPosts ? (
                                    <span>
                                        {formatNumber(stats.totalPosts)} blogs published
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <Button asChild>
                                <Link to={RouteBlogAdd}>Write a new blog</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to={RouteProfileView(profileUser?._id)}>View public profile</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold uppercase text-muted-foreground">At a glance</h2>
                            {overviewLoading && !overviewData ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Skeleton key={`stats-skeleton-${index}`} className="h-24 rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                    {statsItems.map((item) => (
                                        <div key={item.label} className="rounded-xl border bg-muted/10 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                                                    <p className="mt-2 text-2xl font-semibold">{formatNumber(item.value)}</p>
                                                </div>
                                                <item.icon className="size-5 text-primary" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {overviewError && (
                                <p className="text-xs text-destructive">We couldn&apos;t load your performance data right now.</p>
                            )}
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <Card className="border-border/60">
                                <CardHeader className="px-4 pb-0">
                                    <CardTitle className="text-base">Top Performing Blog</CardTitle>
                                    <CardDescription>Your most-viewed Blog based on lifetime views.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 py-4">
                                    {overviewLoading && !topPost ? (
                                        <Skeleton className="h-24 rounded-lg" />
                                    ) : topPost ? (
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">{topPost.title}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(topPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {topPost?.category?.name ? ` · ${topPost.category.name}` : ''}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{formatNumber(topPost.views)} views</span>
                                                <span>{formatNumber(topPost.likeCount)} likes</span>
                                            </div>
                                            <Button asChild variant="link" className="px-0">
                                                <Link to={topPost?.category?.slug && topPost?.slug ? RouteBlogDetails(topPost.category.slug, topPost.slug) : RouteBlog}>
                                                    Open Blog
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Publish a post to start building your highlights.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-border/60">
                                <CardHeader className="px-4 pb-0">
                                    <CardTitle className="text-base">Top Categories</CardTitle>
                                    <CardDescription>The themes you write about the most.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 py-4">
                                    {overviewLoading && topCategories.length === 0 ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 rounded" />
                                            <Skeleton className="h-6 rounded" />
                                            <Skeleton className="h-6 rounded" />
                                        </div>
                                    ) : topCategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {topCategories.map((category) => (
                                                <div key={category.slug || category.name} className="rounded-full border bg-muted/40 px-3 py-1 text-xs">
                                                    <span className="font-medium">{category.name}</span>
                                                    <span className="text-muted-foreground"> · {category.count} posts</span>
                                                    {category.percentage ? (
                                                        <span className="text-muted-foreground"> ({category.percentage}%)</span>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Your published posts will reveal your top categories here.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Update your profile information and password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">

                        <Dropzone onDrop={acceptedFiles => handleFileSelection(acceptedFiles)}>
                            {({ getRootProps, getInputProps }) => (
                                <div {...getRootProps()} className='group inline-block'>
                                    <input {...getInputProps()} />
                                    <Avatar className="relative size-28">
                                        <AvatarImage src={filePreview ? filePreview : (userData?.user?.avatar || defaultAvatar)} />
                                        <div className='absolute inset-0 z-10 hidden items-center justify-center rounded-full border-2 border-primary/80 bg-black/30 group-hover:flex'>
                                            <IoCameraOutline color='#7c3aed' />
                                        </div>
                                    </Avatar>
                                </div>
                            )}
                        </Dropzone>


                    </div>
                    <div className="space-y-6">
                        {usernameHandle && (
                            <div className="rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/20 p-4 text-sm">
                                <p className="text-xs uppercase text-muted-foreground tracking-wide">Username</p>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <code className="text-lg font-semibold">{usernameHandle}</code>
                                    <Button type="button" variant="outline" size="sm" onClick={() => handleCopyUsername(profileUser?.username)}>
                                        {copiedUsername ? 'Copied' : 'Copy handle'}
                                    </Button>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Usernames are unique identifiers and cannot be changed at the moment.
                                </p>
                            </div>
                        )}
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                Display name
                                                <span className="text-xs font-normal text-muted-foreground">optional</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Add a name readers will see"
                                                    maxLength={60}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">If left blank we&apos;ll show your username instead.</p>
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
                                                <span className="text-xs font-normal text-muted-foreground">optional</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Tell readers a little about yourself"
                                                    rows={4}
                                                    maxLength={500}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                                                <span className="text-xs font-normal text-muted-foreground">optional</span>
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

                    </div>

                </CardContent>


            </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Control two-step verification for your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {twoFactorStatusLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-12 rounded-xl" />
                            </div>
                        ) : (
                            <div className="rounded-xl border bg-muted/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <p className="text-base font-semibold">Two-step verification is {twoFactorEnabled ? 'On' : 'Off'}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {twoFactorEnabled
                                            ? `We will email verification codes to ${twoFactorEmailMask || 'your primary email'} when you sign in on new devices.`
                                            : 'Add an extra layer of protection by requiring a verification code during sign in.'}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => startTwoFactorChange(twoFactorEnabled ? 'disable' : 'enable')}
                                    disabled={twoFactorRequestLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {twoFactorRequestLoading ? 'Sending code...' : (twoFactorEnabled ? 'Turn Off 2FA' : 'Turn On 2FA')}
                                </Button>
                            </div>
                        )}

                        {twoFactorAction && (
                            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
                                <p className="text-sm text-primary font-medium">
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
                    </CardContent>
                </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Blogs</CardTitle>
                    <CardDescription>Keep track of how your latest blogs are performing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {overviewLoading && !overviewData ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={`recent-post-skeleton-${index}`} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    ) : recentPosts.length > 0 ? (
                        <div className="space-y-4">
                            {recentPosts.map((post) => (
                                <div key={post.id} className="rounded-xl border bg-muted/10 px-4 py-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-semibold">{post.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                {post?.category?.name && <span>· {post.category.name}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span>{formatNumber(post.views)} views</span>
                                            <span>{formatNumber(post.likeCount)} likes</span>
                                            <Button asChild variant="outline" size="sm">
                                                <Link to={post?.category?.slug && post?.slug ? RouteBlogDetails(post.category.slug, post.slug) : RouteBlog}>View</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Publish your first post to see it listed here.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Publishing Activity</CardTitle>
                    <CardDescription>Your posting streak and consistency over time.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {contributionsLoading && (
                        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                            Loading activity...
                        </div>
                    )}

                    {contributionsError && (
                        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            Unable to load your activity heatmap right now. Please refresh the page to try again.
                        </div>
                    )}

                    {showHeatmap && (
                        <div className="space-y-4">
                            {contributionsData.totalBlogs === 0 && (
                                <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
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
                </CardContent>
            </Card>
        </div>
    )
}

export default Profile