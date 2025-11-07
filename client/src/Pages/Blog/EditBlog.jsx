import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Dropzone from 'react-dropzone'
import Editor from '@/components/Editor'
import { getEnv } from '@/helpers/getEnv'
import { useFetch } from '@/hooks/useFetch'
import Loading from '@/components/Loading'
import { showToast } from '@/helpers/showToast'
import slugify from 'slugify'
import { decode } from 'entities'
import { RouteBlog } from '@/helpers/RouteName'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  categories: z.array(z.string().min(1)).min(1, 'Select at least one category.'),
  title: z.string().min(3, 'Title must be at least 3 character long.'),
  slug: z.string().min(3, 'Slug must be at least 3 character long.'),
  blogContent: z.string().min(3, 'Blog content must be at least 3 character long.'),
})

const EditBlog = () => {
  const { blogid } = useParams()
  const navigate = useNavigate()
  const [filePreview, setFilePreview] = useState(null)
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editorData, setEditorData] = useState('')
  const [categorizing, setCategorizing] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categories: [],
      title: '',
      slug: '',
      blogContent: '',
    },
  })

  const { data: categoryData } = useFetch(`${getEnv('VITE_API_BASE_URL')}/category/all-category`, {
    method: 'get',
    credentials: 'include',
  })

  const availableCategories = useMemo(() => {
    if (!Array.isArray(categoryData?.category)) {
      return []
    }
    return categoryData.category.filter(Boolean)
  }, [categoryData])

  const { data: blogData, loading: blogLoading, error: blogError } = useFetch(
    blogid ? `${getEnv('VITE_API_BASE_URL')}/blog/edit/${blogid}` : null,
    {
      method: 'get',
      credentials: 'include',
    },
    [blogid]
  )

  useEffect(() => {
    if (!blogData?.blog) {
      return
    }

    const { blog } = blogData
    const decodedContent = decode(blog.blogContent || '')

    form.reset({
      categories: Array.isArray(blog.categories) ? blog.categories.map((cat) => String(cat?._id || cat)) : [],
      title: blog.title || '',
      slug: blog.slug || '',
      blogContent: decodedContent || '',
    })

    setEditorData(decodedContent || '')
    setFilePreview(blog.featuredImage || null)
    setFile(null)
  }, [blogData, form])

  const blogTitle = form.watch('title')

  useEffect(() => {
    if (!blogTitle) {
      return
    }
    // Only auto-generate slug if it is currently empty (e.g. user cleared it intentionally)
    const currentSlug = form.getValues('slug')
    if (!currentSlug) {
      form.setValue('slug', slugify(blogTitle, { lower: true }))
    }
  }, [blogTitle, form])

  const handleEditorData = (_event, editor) => {
    const data = editor.getData()
    form.setValue('blogContent', data, { shouldDirty: true })
  }

  const handleFileSelection = (files) => {
    const selected = files?.[0]
    if (!selected) {
      return
    }
    if (filePreview && file instanceof File) {
      URL.revokeObjectURL(filePreview)
    }
    const preview = URL.createObjectURL(selected)
    setFile(selected)
    setFilePreview(preview)
  }

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

  const onSubmit = async (values) => {
    if (!blogid) {
      showToast('error', 'Missing blog id.')
      return
    }

    try {
      setIsSubmitting(true)

      const formData = new FormData()
      formData.append('data', JSON.stringify(values))
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/blog/update/${blogid}`, {
        method: 'put',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        showToast('error', data?.message || 'Failed to update blog.')
        return
      }

      showToast('success', data?.message || 'Blog updated successfully.')
      navigate(RouteBlog)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => () => {
    if (filePreview && file instanceof File) {
      URL.revokeObjectURL(filePreview)
    }
  }, [filePreview, file])

  if (blogLoading) {
    return <Loading />
  }

  if (blogError) {
    return <div className="text-red-500">{blogError.message}</div>
  }

  if (!blogData?.blog) {
    return <div className="text-red-500">Blog not found.</div>
  }

  const editorKey = blogData?.blog?._id ? `blog-editor-${blogData.blog._id}` : 'blog-editor'

  return (
    <div className="mt-9">
      <Card className="pt-5">
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-3">
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
                          {availableCategories.length ? (
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
                                  <span className="text-sm font-medium">{category.name}</span>
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

              <div className="mb-3">
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

              <div className="mb-3">
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

              <div className="mb-3">
                <span className="font-semibold">Featured Image</span>
                <Dropzone onDrop={(acceptedFiles) => handleFileSelection(acceptedFiles)}>
                  {({ getRootProps, getInputProps }) => (
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <div className="border-dashed border-2 border-gray-300 p-5 text-center cursor-pointer h-36 w-36 flex justify-center items-center">
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

              <div className="mb-3">
                <FormField
                  control={form.control}
                  name="blogContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blog Content</FormLabel>
                      <FormControl>
                        <Editor
                          key={editorKey}
                          props={{ initialData: editorData, onChange: handleEditorData }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Blog'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditBlog