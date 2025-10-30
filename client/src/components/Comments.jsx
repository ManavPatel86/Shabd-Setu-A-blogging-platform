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




const Comments = () => {

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
  return (
    <div>
        <h4 className='flex items-center gap-2 text-2xl font-bold'><FaRegComments /> Comments </h4>
        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}  >
                            <div className='mb-3'>
                                <FormField
                                    control={form.control}
                                    name="Comments"
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
    </div>
  )
}

export default Comments