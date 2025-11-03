import React from 'react'
import { FaRegComments } from "react-icons/fa";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { showToast } from '@/helpers/showToast';
import { getEnv } from '@/helpers/getEnv';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useSelector } from 'react-redux';
import { RouteSignIn } from '@/helpers/RouteName';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';

const Comments = ({ blogid }) => {
    const user = useSelector((state)=> state.user)

    const formSchema = z.object({
        comment: z.string().min(3, 'Comment must be at least 3 character long.'),
    })
  
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            comment: '',
        },
    })

    async function onSubmit(values) {
        try {
            const newValues = {
                blogid,
                comment: values.comment
            }
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/comment/add`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newValues)
            })
                    const data = await response.json()
                    if (!response.ok) {
                        return showToast('error', data.message)
                    }
                    form.reset()
                    // Force CommentList to refresh
                    window.dispatchEvent(new Event('refreshComments'))
                    showToast('success', data.message)
                } catch (error) {
                    showToast('error', error.message)
                }
            }
  return (
    <div>
        <h4 className='flex items-center gap-2 text-2xl font-bold mb-4'>
        <FaRegComments /> Comments </h4>
        <CommentList blogid={blogid} />
        {user && user.isLoggedIn 
        ?
        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  >
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="comment"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Comment</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Type your comment..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            <Button type="submit">Submit</Button>
                        </form>
                    </Form>
                    : 
                    <Button asChild> 
                        <Link to={RouteSignIn}>Sign In</Link>
                    </Button>
}   
    </div>
  )
}

export default Comments