import React, { useEffect, useMemo, useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import slugify from 'slugify'
import { showToast } from '@/helpers/showToast'
import { getEnv } from '@/helpers/getEnv' 
import { useFetch } from '@/hooks/useFetch'
import Dropzone from 'react-dropzone'
import Editor from '@/components/Editor'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RouteBlog } from '@/helpers/RouteName'
import { Loader2 } from 'lucide-react'
import ModerationErrorList from '@/components/ModerationErrorList'
import ModerationErrorDisplay from '@/components/ModerationErrorDisplay'


const AddBlog = () => {

        const user=useSelector((state) => state.user)
        const [filePreview, setFilePreview] = useState(null)
            const [file, setFile] = useState(null)
        const [categorizing, setCategorizing] = useState(false)
        const [moderationErrors, setModerationErrors] = useState({ badLines: [], suggestions: [], message: '' })


  const { data: categoryData, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/category/all-category`, {
          method: 'get',
          credentials: 'include'
      }) 

    const formSchema = z.object({
                categories: z.array(z.string().min(1)).min(1, 'Select at least one category.'),
                title: z.string().min(3, 'Title must be at least 3 character long.'),
                slug: z.string().min(3, 'Slug must be at least 3 character long.'),
                blogContent: z.string().min(3, 'Blog Content must be at least 3 character long.'),
        })
  
      const form = useForm({
          resolver: zodResolver(formSchema),
          defaultValues: {
              categories: [],
              title: '',
              slug: '',
              blogContent: '',
          },
      })

      const blogTitle = form.watch('title')

      const handleEditorData = (event, editor) => {
        const data = editor.getData();
        form.setValue('blogContent', data);
    }

      useEffect(() => {
          if (blogTitle) {
              const slug = slugify(blogTitle, { lower: true })
              form.setValue('slug', slug)
          }
      }, [blogTitle])

    const navigate = useNavigate()

     async function onSubmit(values) {

        try {
            setModerationErrors({ badLines: [], suggestions: [], message: '' });
            const newValues = { ...values, author: user?.user?._id }
            if (!file) {
                showToast('error', 'Feature image required.')
                return
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('data', JSON.stringify(newValues))

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/blog/add`, {
                method: 'post',
                credentials: 'include',
                body: formData
            })
            const data = await response.json()
            if (!response.ok) {
                if (data.badLines || data.suggestions) {
                    setModerationErrors({
                        badLines: data.badLines || [],
                        suggestions: data.suggestions || [],
                        message: data.message || 'Blog content failed moderation.'
                    });
                }
                return showToast('error', data.message)
            }
            form.reset()
            setFile(null)
            setFilePreview(null)
            navigate(RouteBlog)
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        }
    }

      const handleFileSelection = (files) => {
        const file = files[0]
        const preview = URL.createObjectURL(file)
        setFile(file)
        setFilePreview(preview)
    }

    const availableCategories = useMemo(() => {
        if (!Array.isArray(categoryData?.category)) {
            return []
        }
        return categoryData.category.filter(Boolean)
    }, [categoryData])

    const handleCategorizeWithAI = async () => {
        const values = form.getValues()
        const title = values?.title || ''
        const blogContent = values?.blogContent || ''
        const strippedContent = blogContent.replace(/<[^>]*>/g, '').trim()

        if (!strippedContent) {
            showToast('error', 'Add some blog content before using AI categorization.')
            return
        }

        if (!availableCategories.length) {
            showToast('error', 'No categories are available to match against yet.')
            return
        }

        try {
            setCategorizing(true)

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/blog/categorize`, {
                method: 'post',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: blogContent,
                    maxCategories: 3,
                }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showToast('error', data?.message || 'Failed to categorize blog.')
                return
            }

            const aiCategories = Array.isArray(data?.categories) ? data.categories.filter(Boolean) : []
            if (!aiCategories.length) {
                showToast('error', 'AI could not map this post to existing categories.')
                return
            }

            const availableIds = new Set(availableCategories.map((category) => category._id))
            const suggestedIds = aiCategories
                .map((category) => category?._id)
                .filter((id) => Boolean(id) && availableIds.has(id))

            if (!suggestedIds.length) {
                showToast('error', 'AI returned categories that are not available in the system.')
                return
            }

            form.setValue('categories', Array.from(new Set(suggestedIds)), {
                shouldDirty: true,
                shouldValidate: true,
            })

            showToast('success', 'Categories updated using AI suggestions.')
        } catch (error) {
            showToast('error', error.message || 'Failed to categorize blog.')
        } finally {
            setCategorizing(false)
        }
    }

  return (
        <div className='mt-9'>
            <Card className="pt-5 ">
                <CardContent>
                    <ModerationErrorList badLines={moderationErrors.badLines} suggestions={moderationErrors.suggestions} />
                        {moderationErrors.badLines?.length > 0 && (
                        <ModerationErrorDisplay
                            errors={moderationErrors.badLines}
                            suggestions={moderationErrors.suggestions}
                            onClose={() => setModerationErrors({ badLines: [], suggestions: [], message: '' })}
                            onFixLine={(lineNum) => {
                                // If line 1 -> focus title, line 2 -> focus slug, otherwise scroll to editor
                                if (lineNum === 1) {
                                    const titleInput = document.querySelector('input[name="title"]');
                                    if (titleInput) {
                                        titleInput.focus();
                                        titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        return;
                                    }
                                }
                                if (lineNum === 2) {
                                    const slugInput = document.querySelector('input[name="slug"]');
                                    if (slugInput) {
                                        slugInput.focus();
                                        slugInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        return;
                                    }
                                }
                                // Otherwise jump to editor area
                                const editorFrame = document.querySelector('iframe[role="application"]');
                                if (editorFrame) {
                                    editorFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    // try to focus if possible
                                    try { editorFrame.contentWindow?.focus(); } catch (e) {}
                                }
                                showToast('info', `Please fix line ${lineNum} in the editor`);
                            }}
                        />
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  >
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="categories"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center justify-between gap-3">
                                                <span>Categories</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCategorizeWithAI}
                                                    disabled={categorizing}
                                                >
                                                    {categorizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    Categorize with AI
                                                </Button>
                                            </FormLabel>
                                            <FormControl>
                                                <div className="flex flex-wrap gap-2">
                                                    {availableCategories.length > 0 ? (
                                                        availableCategories.map((category) => {
                                                            const selected = Array.isArray(field.value) ? field.value : []
                                                            const isChecked = selected.includes(category._id)
                                                            return (
                                                                <label
                                                                    key={category._id}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-colors ${
                                                                        isChecked ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={(event) => {
                                                                            const checked = event.target.checked
                                                                            const current = Array.isArray(field.value) ? field.value : []
                                                                            const next = checked
                                                                                ? [...current, category._id]
                                                                                : current.filter((id) => id !== category._id)
                                                                            field.onChange(next)
                                                                        }}
                                                                        className="accent-blue-500 h-4 w-4"
                                                                    />
                                                                    <span className="text-sm font-medium">
                                                                        {category.name}
                                                                    </span>
                                                                </label>
                                                            )
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-gray-500">No categories available</span>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter blog title" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slug</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Slug" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-3'>
                                <span className='font-semibold'>Featured Image</span>
                                <Dropzone onDrop={acceptedFiles => handleFileSelection(acceptedFiles)}>
                                  {({ getRootProps, getInputProps }) => (
                                      <div {...getRootProps()}>
                                          <input {...getInputProps()} />
                                          <div className='border-dashed border-2 border-gray-300 p-5 text-center cursor-pointer h-36 w-36 flex justify-center items-center'>
                                              {filePreview ? (
                                                  <img src={filePreview} alt="Preview" className="mx-auto max-h-48" />
                                              ) : (
                                                  <p>click to select image</p>
                                              )}
                                          </div>
                                      </div>
                                  )}
                              </Dropzone>
                            </div>

                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="blogContent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Blog Content</FormLabel>
                                            <FormControl>
                                                <Editor props={{ initialData: '', onChange: handleEditorData }} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full">Submit</Button>
                        </form>
                    </Form>

                </CardContent>
            </Card>

        </div>
    )
}

export default AddBlog;