import React from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import BackButton from '@/components/BackButton'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import slugify from 'slugify'
import { showToast } from '@/helpers/showToast'
import { getEnv } from '@/helpers/getEnv'
import { FolderPlus, Sparkles, ShieldCheck } from 'lucide-react'

const AddCategory = () => {
    const formSchema = z.object({
        name: z.string().min(3, 'Name must be at least 3 characters long.'),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
        },
    })

    const helperCards = [
        {
            title: 'Keep it distinct',
            description: 'Choose names that clearly separate this topic from others in your library.',
            icon: Sparkles,
            accent: 'from-[#6C5CE7] to-[#8E7CF3]'
        },
        {
            title: 'Human-friendly labels',
            description: 'Readers should instantly understand what belongs here. Avoid internal codes.',
            icon: ShieldCheck,
            accent: 'from-emerald-400 to-emerald-600'
        }
    ]

    async function onSubmit(values) {
        try {
            const payload = {
                name: values.name.trim(),
                slug: slugify(values.name, { lower: true, strict: true }),
            }

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/category/add`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()
            if (!response.ok) {
                return showToast('error', data.message)
            }

            form.reset()
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        }
    }

    return (
        <div className="px-4 pt-6 pb-12 space-y-8 sm:px-8 lg:px-12 lg:pt-10">
            <section className="relative max-w-4xl mx-auto overflow-hidden rounded-[28px] border border-gray-100 bg-white/90 px-6 py-8 shadow-[0_35px_90px_-60px_rgba(15,23,42,0.6)]">
                <div className="absolute inset-0 bg-linear-to-br from-[#6C5CE7]/10 via-transparent to-[#8B5CF6]/10" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-gray-400">
                            Library · Categories
                        </p>
                        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">
                            Create a new category
                        </h1>
                        <p className="max-w-2xl text-sm text-gray-500">
                            Organize future stories under a meaningful label. We’ll handle the URL-friendly slug automatically so you can focus on clarity for readers.
                        </p>
                    </div>
                    <div className="flex items-center justify-center rounded-3xl bg-purple-50 p-4 text-[#6C5CE7]">
                        <FolderPlus size={32} />
                    </div>
                </div>
            </section>

            <section className="grid max-w-5xl gap-6 mx-auto lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Card className="border-gray-100 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.5)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            Category details
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                            Add a recognizable name. The slug will be generated automatically when you submit.
                        </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
                                                Category name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Product Announcements"
                                                    {...field}
                                                    className="h-12 border-gray-200 focus-visible:ring-[#6C5CE7]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" className="w-full h-12 text-sm font-semibold bg-linear-to-r from-[#6C5CE7] to-[#8E7CF3] shadow-md shadow-purple-200/60">
                                    Create category
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {helperCards.map((card) => {
                        const Icon = card.icon
                        return (
                            <div
                                key={card.title}
                                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/90 p-5 shadow-[0_25px_60px_-55px_rgba(15,23,42,0.45)]"
                            >
                                <div className={`absolute inset-0 bg-linear-to-br ${card.accent} opacity-[0.12]`} />
                                <div className="relative flex gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#6C5CE7] shadow-sm">
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{card.description}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

export default AddCategory;