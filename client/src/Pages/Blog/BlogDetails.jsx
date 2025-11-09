import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { RouteBlogAdd, RouteBlogEdit } from '@/helpers/RouteName'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import { deleteData } from '@/helpers/handleDelete'
import { showToast } from '@/helpers/showToast'
import Loading from '@/components/Loading'
import { useState } from 'react'
import { FiEdit } from "react-icons/fi"
import { FaRegTrashAlt } from "react-icons/fa"
import moment from 'moment'
import { useSelector } from 'react-redux'
import { RouteAnalytics } from '@/helpers/RouteName'

const BlogDetails = () => {
    const [refreshData, setRefreshData] = useState(false)
    const { data: blogData, loading, error } = useFetch(`${getEnv('VITE_API_BASE_URL')}/blog/get-all`, {
        method: 'get',
        credentials: 'include'
    }, [refreshData])
    const user = useSelector((state) => state.user)
    const navigate = useNavigate()

    const isAdmin = user?.user?.role === 'admin'

    const handleDelete = async (id) => {
        const deleted = await deleteData(`${getEnv('VITE_API_BASE_URL')}/blog/delete/${id}`)
        if (deleted) {
            setRefreshData(!refreshData)
            showToast('success', 'Blog deleted successfully')
        }
    }

    if (loading) return <Loading />
    if (error) return <div className="text-red-500">Error loading blogs: {error.message}</div>

    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        {/* Add Blog Button */}
                        <Button asChild>
                            <Link to={RouteBlogAdd}>
                                Add Blog
                            </Link>
                        </Button>

                        {/* Analytics Button (new) */}
                        <Button
                            onClick={() => navigate(RouteAnalytics)}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Analytics
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isAdmin && <TableHead>Author</TableHead>}
                                <TableHead className="whitespace-normal">Title</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {blogData && blogData.blog.length > 0 ? (
                                blogData.blog.map((blog) => (
                                    <TableRow key={blog._id}>
                                        {isAdmin && <TableCell>{blog?.author?.name}</TableCell>}
                                        <TableCell className="max-w-[240px] whitespace-normal break-words text-sm">
                                            {blog?.title}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] whitespace-normal break-words text-sm">
                                            {Array.isArray(blog?.categories) && blog.categories.length > 0
                                                ? blog.categories
                                                    .map((category) => category?.name)
                                                    .filter(Boolean)
                                                    .join(', ')
                                                : 'Uncategorized'}
                                        </TableCell>
                                        <TableCell>{moment(blog?.createdAt).format('DD-MM-YYYY')}</TableCell>
                                        <TableCell className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="hover:bg-violet-500 hover:text-white"
                                                asChild
                                            >
                                                <Link to={RouteBlogEdit(blog._id)}>
                                                    <FiEdit />
                                                </Link>
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(blog._id)}
                                                variant="outline"
                                                className="hover:bg-violet-500 hover:text-white"
                                            >
                                                <FaRegTrashAlt />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        Data not found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default BlogDetails
