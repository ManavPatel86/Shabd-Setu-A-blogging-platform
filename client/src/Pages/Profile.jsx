import { Avatar, AvatarImage } from '../components/ui/avatar'
import { Card, CardContent } from '../components/ui/card'
import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form'
import { Input } from '../components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { showToast } from '@/helpers/showToast'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { Textarea } from "../components/ui/textarea"
import { useDropzone } from 'react-dropzone'
import Dropzone from 'react-dropzone'
import { IoCameraOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import usericon from '@/assets/images/user.png'

const Profile = () => {

    const dispath = useDispatch()
    const user = useSelector((state) => state.user)
    const navigate = useNavigate()
    
    // Temporary user data for development
    const userData = {
        success: true,
        user: {
            name: "John Doe",
            email: "john.doe@example.com",
            bio: "I'm a passionate blogger who loves to write about technology, life, and everything in between.",
            avatar: usericon
        }
    }
    
    const [filePreview, setFilePreview] = useState(null)
    const [file, setFile] = useState(null)

    const formSchema = z.object({
        name: z.string().min(3, 'Name must be at least 3 character long.'),
        email: z.string().email(),
        bio: z.string().min(3, 'Bio must be at least 3 character long.'),
        password: z.string().refine((val) => val === '' || val.length >= 6, {
            message: 'Password must be at least 6 characters long or leave empty'
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
                name: userData.user.name,
                email: userData.user.email,
                bio: userData.user.bio,
                password: '',
            })
        }
    }, [])

    async function onSubmit(values) {
        try {
            console.log('Profile data to save:', values);
            showToast('Profile updated successfully!', 'success');
            navigate('/');
        } catch (error) {
            showToast('Failed to update profile. Please try again.', 'error');
            console.error('Error updating profile:', error);
        }
    }

    const handleFileSelection = (files) => {
        const file = files[0]
        const preview = URL.createObjectURL(file)
        setFile(file)
        setFilePreview(preview)
    }

    return (
        <Card className="max-w-screen-md mx-auto mt-8">

            <CardContent>
                <div className='flex justify-center items-center mt-10' >
                    <Dropzone onDrop={acceptedFiles => handleFileSelection(acceptedFiles)}>
                        {({ getRootProps, getInputProps }) => (
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <Avatar className="w-28 h-28 relative group">
                                    <AvatarImage src={filePreview ? filePreview : userData?.user?.avatar} />
                                    <div className='absolute z-50 w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center items-center bg-black bg-opacity-20 border-2 border-violet-500 rounded-full group-hover:flex hidden cursor-pointer'>
                                        <IoCameraOutline color='#7c3aed' />
                                    </div>
                                </Avatar>
                            </div>
                        )}
                    </Dropzone>

                </div>
                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  >
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter your name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-3'>
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
                            </div>
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bio</FormLabel>
                                            <FormControl>

                                                <Textarea type="password" placeholder="Enter bio" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Leave empty to keep current password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                    </Form>

                </div>

            </CardContent>


        </Card>
    )
}

export default Profile