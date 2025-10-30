import React, { use, useEffect } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFetch } from '@/hooks/useFetch'
import { useState } from 'react'
import Dropzone from 'react-dropzone'
import Editor from '@/components/Editor'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RouteBlog } from '@/helpers/RouteName'


const AddBlog = () => {

    const user=useSelector((state) => state.user)
    const [filePreview, setFilePreview] = useState(null)
      const [file, setFile] = useState(null)


  const { data: categoryData, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/category/all-category`, {
          method: 'get',
          credentials: 'include'
      }) 

  const formSchema = z.object({
        category: z.string().min(3, 'Category must be at least 3 character long.'),
        title: z.string().min(3, 'Title must be at least 3 character long.'),
        slug: z.string().min(3, 'Slug must be at least 3 character long.'),
        blogContent: z.string().min(3, 'Blog Content must be at least 3 character long.'),
    })
  
      const form = useForm({
          resolver: zodResolver(formSchema),
          defaultValues: {
              category: '',
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

      /*async function onSubmit(values) {
           try {
               const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/category/add`, {
                   method: 'POST',
                   headers: { 'Content-type': 'application/json' },
                   body: JSON.stringify(values)
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
      */
    const navigate = useNavigate()

    async function onSubmit(values) {

        try {
            const newValues = { ...values, author: user?.user?._id }
            if (!file) {
                showToast('error', 'Feature image required.')
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

  return (
        <div className='mt-9'>
            <Card className="pt-5 ">
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  >
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                  <SelectTrigger >
                                                    <SelectValue placeholder="Select category" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {categoryData && categoryData.category.length > 0 ?
                                                      categoryData.category.map(category =>
                                                        <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
                                                      ) : (
                                                        <SelectItem disabled>No categories available</SelectItem>
                                                      )}
                                                  </SelectContent>
                                                </Select>
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