import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import slugify from 'slugify'
import { showToast } from '@/helpers/showToast'
import { getEnv } from '@/helpers/getEnv' 
import { useFetch } from '@/hooks/useFetch'
import Dropzone from 'react-dropzone'
import Editor from '@/components/Editor'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RouteBlog } from '@/helpers/RouteName'
import { Loader2, Save, Send, Image as ImageIcon, X, FileText, Sparkles, Type, MessageSquare } from 'lucide-react'
import ModerationErrorList from '@/components/ModerationErrorList'
import ModerationErrorDisplay from '@/components/ModerationErrorDisplay'


const MAX_CATEGORIES = 5


const AddBlog = () => {

        const user=useSelector((state) => state.user)
        const [filePreview, setFilePreview] = useState(null)
        const [file, setFile] = useState(null)
        const [categorizing, setCategorizing] = useState(false)
        const [moderationErrors, setModerationErrors] = useState({ badLines: [], suggestions: [], message: '', summary: '' })
        const [isSubmitting, setIsSubmitting] = useState(false)
        const [isSavingDraft, setIsSavingDraft] = useState(false)
        const [generatingDescription, setGeneratingDescription] = useState(false)
        const autoSaveTimerRef = useRef(null)
        const [lastSaved, setLastSaved] = useState(null)
        const [contentLength, setContentLength] = useState(0)
        const MAX_CONTENT_LENGTH = 35000
        const [savedDraftId, setSavedDraftId] = useState(null)
        const [lastCategorizedContent, setLastCategorizedContent] = useState('')
        const [lastDescriptionContent, setLastDescriptionContent] = useState('')
        const [cachedCategories, setCachedCategories] = useState(null)
        const [cachedDescription, setCachedDescription] = useState(null)


  const { data: categoryData, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/category/all-category`, {
          method: 'get',
          credentials: 'include'
      }) 

    const formSchema = z.object({
                categories: z.array(z.string().min(1))
                    .max(MAX_CATEGORIES, { message: `Select max ${MAX_CATEGORIES} categories.` })
                    .optional()
                    .default([]),
                title: z.string().optional().default(''),
                blogContent: z.string().optional().default(''),
                description: z.string().optional().default(''),
        })
  
      const form = useForm({
          resolver: zodResolver(formSchema),
          defaultValues: {
              categories: [],
              title: '',
              blogContent: '',
              description: '',
          },
      })

      const handleEditorData = (event, editor) => {
        const data = editor.getData();
        const textContent = data.replace(/<[^>]*>/g, '').trim();
        const length = textContent.length;
        
        if (length > MAX_CONTENT_LENGTH) {
            showToast('error', `Content exceeds maximum length of ${MAX_CONTENT_LENGTH.toLocaleString()} characters`);
            return;
        }
        
        setContentLength(length);
        form.setValue('blogContent', data);
    }

    const navigate = useNavigate()

    // Auto-save draft functionality
    const saveDraft = useCallback(async (values, silent = false) => {
        try {
            if (!silent) {
                setIsSavingDraft(true)
            }

            const formData = new FormData()
            const draftData = { ...values, status: 'draft' }
            formData.append('data', JSON.stringify(draftData))
            if (file) {
                formData.append('file', file)
            }

            // If we have a saved draft ID, update it instead of creating new
            const endpoint = savedDraftId 
                ? `${getEnv('VITE_API_BASE_URL')}/blog/update/${savedDraftId}`
                : `${getEnv('VITE_API_BASE_URL')}/blog/add`
            
            const method = savedDraftId ? 'put' : 'post'

            const response = await fetch(endpoint, {
                method: method,
                credentials: 'include',
                body: formData
            })
            const data = await response.json()
            
            if (!response.ok) {
                if (!silent) {
                    showToast('error', data.message)
                }
                return null
            }
            
            // Store the draft ID for future updates
            if (!savedDraftId && data.blog?._id) {
                setSavedDraftId(data.blog._id)
            }
            
            if (!silent) {
                showToast('success', 'Draft saved successfully')
            }
            setLastSaved(new Date())
            return data.blog
        } catch (error) {
            if (!silent) {
                showToast('error', error.message)
            }
            return null
        } finally {
            if (!silent) {
                setIsSavingDraft(false)
            }
        }
    }, [file, savedDraftId])

    // Auto-save timer
    const scheduleAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
        }
        
        autoSaveTimerRef.current = setTimeout(() => {
            const values = form.getValues()
            if (values.title || values.blogContent) {
                saveDraft(values, true)
            }
        }, 30000) // Auto-save every 30 seconds
    }, [form, saveDraft])

    // Clean up auto-save timer on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current)
            }
        }
    }, [])

    // Trigger auto-save when content changes
    useEffect(() => {
        scheduleAutoSave()
    }, [form.watch('title'), form.watch('blogContent'), scheduleAutoSave])

    async function onSubmit(values, isDraft = false) {
        setIsSubmitting(true)
        try {
            setModerationErrors({ badLines: [], suggestions: [], message: '', summary: '' })

            // Require a featured image when publishing
            if (!isDraft && !file && !filePreview) {
                showToast('error', 'Featured image is required.')
                return
            }

            // Validate required fields for published blogs
            if (!isDraft) {
                if (!values.categories || values.categories.length === 0) {
                    showToast('error', 'Please select at least one category.')
                    return
                }
                if (!values.title || values.title.trim().length < 3) {
                    showToast('error', 'Title must be at least 3 characters long.')
                    return
                }
                if (!values.blogContent || values.blogContent.trim().length < 3) {
                    showToast('error', 'Blog content must be at least 3 characters long.')
                    return
                }
                const textContent = values.blogContent.replace(/<[^>]*>/g, '').trim()
                if (textContent.length > MAX_CONTENT_LENGTH) {
                    showToast('error', `Blog content exceeds maximum length of ${MAX_CONTENT_LENGTH.toLocaleString()} characters`)
                    return
                }
            }

            const payload = { ...values, author: user?.user?._id, status: isDraft ? 'draft' : 'published' }

            const formData = new FormData()
            if (file) {
                formData.append('file', file)
            }
            formData.append('data', JSON.stringify(payload))

            // If we have a saved draft, update instead of create
            const endpoint = savedDraftId
                ? `${getEnv('VITE_API_BASE_URL')}/blog/update/${savedDraftId}`
                : `${getEnv('VITE_API_BASE_URL')}/blog/add`
            const method = savedDraftId ? 'put' : 'post'

            const response = await fetch(endpoint, {
                method,
                credentials: 'include',
                body: formData
            })

            const data = await response.json()
            if (!response.ok) {
                if (data.badLines || data.suggestions || data.summary) {
                    setModerationErrors({
                        badLines: data.badLines || [],
                        suggestions: data.suggestions || [],
                        message: data.summary || data.message || 'Blog content failed moderation.',
                        summary: data.summary || '',
                    })
                }
                showToast('error', data.message || 'Failed to submit blog')
                return
            }

            form.reset()
            setFile(null)
            setFilePreview(null)
            setLastSaved(null)
            setSavedDraftId(null)
            setModerationErrors({ badLines: [], suggestions: [], message: '', summary: '' })
            navigate(RouteBlog)
            showToast('success', data.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSaveDraft = async () => {
        const values = form.getValues()
        await saveDraft(values, false)
    }

      const handleFileSelection = (files) => {
        const file = files[0]
        if (file) {
            // Validate file size (5MB = 5 * 1024 * 1024 bytes)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                showToast('error', 'Image size must be less than 5MB');
                return;
            }
            const preview = URL.createObjectURL(file)
            setFile(file)
            setFilePreview(preview)
        }
    }

    const removeImage = () => {
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
        }
        setFile(null)
        setFilePreview(null)
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

        // Check if content has changed since last categorization
        const contentSignature = `${title}::${strippedContent}`
        if (contentSignature === lastCategorizedContent && cachedCategories) {
            form.setValue('categories', cachedCategories, {
                shouldDirty: true,
                shouldValidate: true,
            })
            showToast('info', 'Content unchanged - using previous categorization.')
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
                    maxCategories: MAX_CATEGORIES,
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

            const uniqueSuggested = Array.from(new Set(suggestedIds))
            const limitedSuggested = uniqueSuggested.slice(0, MAX_CATEGORIES)
            if (uniqueSuggested.length > MAX_CATEGORIES) {
                showToast('info', `AI suggested more than ${MAX_CATEGORIES} categories. Using the first ${MAX_CATEGORIES}.`)
            }

            form.setValue('categories', limitedSuggested, {
                shouldDirty: true,
                shouldValidate: true,
            })

            // Cache the result and content signature
            setCachedCategories(limitedSuggested)
            setLastCategorizedContent(contentSignature)

            showToast('success', 'Categories updated using AI suggestions.')
        } catch (error) {
            showToast('error', error.message || 'Failed to categorize blog.')
        } finally {
            setCategorizing(false)
        }
    }

    const handleGenerateDescription = async () => {
        const values = form.getValues()
        const title = values?.title || ''
        const blogContent = values?.blogContent || ''
        const strippedContent = blogContent.replace(/<[^>]*>/g, '').trim()

        if (!title && !strippedContent) {
            showToast('error', 'Add a title or blog content before generating description.')
            return
        }

        // Check if content has changed since last description generation
        const contentSignature = `${title}::${strippedContent}`
        if (contentSignature === lastDescriptionContent && cachedDescription) {
            form.setValue('description', cachedDescription, {
                shouldDirty: true,
                shouldValidate: true,
            })
            showToast('info', 'Content unchanged - using previous description.')
            return
        }

        try {
            setGeneratingDescription(true)

            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/blog/generate-description`, {
                method: 'post',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: blogContent,
                }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                showToast('error', data?.message || 'Failed to generate description.')
                return
            }

            if (data?.description) {
                form.setValue('description', data.description, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
                
                // Cache the result and content signature
                setCachedDescription(data.description)
                setLastDescriptionContent(contentSignature)
                
                showToast('success', 'Description generated successfully.')
            } else {
                showToast('error', 'No description was generated.')
            }
        } catch (error) {
            showToast('error', error.message || 'Failed to generate description.')
        } finally {
            setGeneratingDescription(false)
        }
    }

  return (
    <div className='mt-9'>
      <div className='max-w-6xl mx-auto px-4'>
        <ModerationErrorList badLines={moderationErrors.badLines} suggestions={moderationErrors.suggestions} />
        {moderationErrors.badLines?.length > 0 && (
          <ModerationErrorDisplay
            errors={moderationErrors.badLines}
            suggestions={moderationErrors.suggestions}
                        summary={moderationErrors.summary || moderationErrors.message}
                        onClose={() => setModerationErrors({ badLines: [], suggestions: [], message: '', summary: '' })}
            onFixLine={(lineNum) => {
              if (lineNum === 1) {
                const titleInput = document.querySelector('input[name="title"]')
                if (titleInput) {
                  titleInput.focus()
                  titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  return
                }
              }
              if (lineNum === 2) {
                const slugInput = document.querySelector('input[name="slug"]')
                if (slugInput) {
                  slugInput.focus()
                  slugInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  return
                }
              }
              const editorFrame = document.querySelector('iframe[role="application"]')
              if (editorFrame) {
                editorFrame.scrollIntoView({ behavior: 'smooth', block: 'center' })
                try { editorFrame.contentWindow?.focus() } catch (e) {}
              }
              showToast('info', `Please fix line ${lineNum} in the editor`)
            }}
          />
        )}

        <div className='mb-8'>
          <h1 className="text-3xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">Create New Blog Post</h1>
          <p className="text-gray-600 dark:text-gray-400">Share your thoughts and stories with the world</p>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-6">
                    
                    {/* Title Card */}
                    <Card className="border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Type className="h-5 w-5 text-violet-600" />
                                <CardTitle>Blog Title</CardTitle>
                            </div>
                            <CardDescription>Give your blog post a catchy and descriptive title (max 100 characters)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Title *</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Enter an engaging title for your blog post..." 
                                                {...field} 
                                                maxLength={100}
                                                className="text-lg h-12"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/100 characters</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Categories Card */}
                    <Card className="border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-violet-600" />
                                        <CardTitle>Categories *</CardTitle>
                                    </div>
                                    <CardDescription>Select max {MAX_CATEGORIES} categories for your blog post</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCategorizeWithAI}
                                    disabled={categorizing}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    {categorizing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            AI Categorize
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="categories"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="flex flex-wrap gap-3">
                                                {availableCategories.length > 0 ? (
                                                    availableCategories.map((category) => {
                                                        const selected = Array.isArray(field.value) ? field.value : []
                                                        const isChecked = selected.includes(category._id)
                                                        return (
                                                            <label
                                                                key={category._id}
                                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer transition-all transform hover:scale-105 ${
                                                                    isChecked 
                                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-500 hover:bg-violet-50 hover:text-gray-900 dark:hover:bg-violet-900/20 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(event) => {
                                                                        const checked = event.target.checked
                                                                        const current = Array.isArray(field.value) ? field.value : []
                                                                        if (checked && current.length >= MAX_CATEGORIES) {
                                                                            showToast('error', `You can select up to ${MAX_CATEGORIES} categories.`)
                                                                            event.preventDefault()
                                                                            event.target.checked = false
                                                                            return
                                                                        }
                                                                        const next = checked
                                                                            ? Array.from(new Set([...current, category._id])).slice(0, MAX_CATEGORIES)
                                                                            : current.filter((id) => id !== category._id)
                                                                        field.onChange(next)
                                                                    }}
                                                                    className="hidden"
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
                                        <p className="pt-2 text-xs text-gray-500">You can assign up to {MAX_CATEGORIES} categories.</p>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Featured Image Card */}
                    <Card className="border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-violet-600" />
                                <CardTitle>Featured Image *</CardTitle>
                            </div>
                            <CardDescription>Upload a thumbnail image for your blog post</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Dropzone onDrop={acceptedFiles => handleFileSelection(acceptedFiles)}>
                                {({ getRootProps, getInputProps, isDragActive }) => (
                                    <div {...getRootProps()}>
                                        <input {...getInputProps()} />
                                        {filePreview ? (
                                            <div className="relative group">
                                                <img 
                                                    src={filePreview} 
                                                    alt="Preview" 
                                                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700" 
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeImage()
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Remove Image
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                                                isDragActive 
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}>
                                                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {isDragActive ? 'Drop your image here' : 'Click to upload or drag and drop'}
                                                </p>
                                                <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Dropzone>
                        </CardContent>
                    </Card>

                    {/* Blog Content Card */}
                    <Card className="border hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle>Blog Content *</CardTitle>
                            <CardDescription>Write your blog post content with rich formatting (recommended: 300-2000 words, max: 35,000 characters)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="blogContent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Editor initialData="" onChange={handleEditorData} />
                                            </div>
                                        </FormControl>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {contentLength.toLocaleString()}/35,000 characters
                                            {contentLength > 0 && ` (≈ ${Math.round(contentLength / 7)} words)`}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Description Card */}
                    <Card className="border hover:shadow-md transition-all">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-violet-600" />
                                        <CardTitle>Blog Description</CardTitle>
                                    </div>
                                    <CardDescription>Write a brief description of your blog post (3-4 lines, max 300 characters)</CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateDescription}
                                    disabled={generatingDescription}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    {generatingDescription ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            AI Generate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">Description</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Enter a brief description of your blog post that will appear in previews and search results..."
                                                {...field}
                                                maxLength={300}
                                                rows={4}
                                                className="resize-none"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/300 characters</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end p-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft || isSubmitting}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            {isSavingDraft ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Draft
                                </>
                            )}
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || isSavingDraft}
                            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Publish Blog
                                </>
                            )}
                        </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default AddBlog