import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import slugify from 'slugify'
import { useNavigate } from 'react-router-dom'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RouteCategoryDetails } from '@/helpers/RouteName'
import { getEnv } from '@/helpers/getEnv'
import { showToast } from '@/helpers/showToast'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long.'),
    slug: z.string()
        .min(2, 'Slug must be at least 2 characters long.')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
})

const AddCategory = () => {
    const navigate = useNavigate()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            slug: '',
        },
    })

    const handleNameChange = (event, field) => {
        const value = event.target.value
        field.onChange(value)
        if (!slugManuallyEdited) {
            const autoSlug = slugify(value, {
                lower: true,
                strict: true,
                trim: true,
            })
            form.setValue('slug', autoSlug, { shouldValidate: true, shouldDirty: Boolean(autoSlug) })
        }
    }

    const handleSlugChange = (event, field) => {
        const rawValue = event.target.value
        const value = slugify(rawValue, {
            lower: true,
            strict: true,
            trim: true,
        })
        setSlugManuallyEdited(Boolean(rawValue.trim().length))
        field.onChange(value)
    }

    const onSubmit = async (values) => {
        try {
            setIsSubmitting(true)
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/category/add`, {
                method: 'post',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(data?.message || 'Failed to create category.')
            }

            showToast('success', data?.message || 'Category added successfully.')
            form.reset({ name: '', slug: '' })
            setSlugManuallyEdited(false)
            navigate(RouteCategoryDetails)
        } catch (error) {
            showToast('error', error.message || 'Unable to create category right now.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create a new category</CardTitle>
                    <CardDescription>
                        Categories keep the library organised and help readers discover related stories faster.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                onChange={(event) => handleNameChange(event, field)}
                                                placeholder="e.g. ✨ Creative Writing"
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                onChange={(event) => handleSlugChange(event, field)}
                                                placeholder="creative-writing"
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center gap-3">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create category
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(RouteCategoryDetails)}
                                    disabled={isSubmitting}
                                >
                                    Back to categories
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default AddCategory
