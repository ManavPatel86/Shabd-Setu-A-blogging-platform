import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import slugify from 'slugify'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RouteCategoryDetails } from '@/helpers/RouteName'
import { getEnv } from '@/helpers/getEnv'
import { showToast } from '@/helpers/showToast'
import { useFetch } from '@/hooks/useFetch'
import Loading from '@/components/Loading'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long.'),
    slug: z.string()
        .min(2, 'Slug must be at least 2 characters long.')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
})

const EditCategory = () => {
    const { category_id: categoryId } = useParams()
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

    const categoryEndpoint = categoryId ? `${getEnv('VITE_API_BASE_URL')}/category/show/${categoryId}` : null
    const { data, loading, error } = useFetch(categoryEndpoint, {
        method: 'get',
        credentials: 'include',
    }, [categoryEndpoint, categoryId])

    useEffect(() => {
        if (data?.category) {
            form.reset({
                name: data.category.name || '',
                slug: data.category.slug || '',
            })
            setSlugManuallyEdited(false)
        }
    }, [data, form])

    useEffect(() => {
        if (error) {
            showToast('error', error.message || 'Failed to load category.')
        }
    }, [error])

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
        if (!categoryId) {
            showToast('error', 'Missing category identifier.')
            return
        }

        try {
            setIsSubmitting(true)
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/category/update/${categoryId}`, {
                method: 'put',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            const responseData = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(responseData?.message || 'Failed to update category.')
            }

            showToast('success', responseData?.message || 'Category updated successfully.')
            navigate(RouteCategoryDetails)
        } catch (err) {
            showToast('error', err.message || 'Unable to update category right now.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return <Loading />
    }

    if (!data?.category) {
        return (
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Category not found</CardTitle>
                        <CardDescription>
                            The category you are trying to edit may have been removed. Return to the overview to continue managing categories.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => navigate(RouteCategoryDetails)}>
                            Back to categories
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Edit category</CardTitle>
                    <CardDescription>Update the name or slug to refine how this category appears to readers.</CardDescription>
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
                                    Save changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(RouteCategoryDetails)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default EditCategory
