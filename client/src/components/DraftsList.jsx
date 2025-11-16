import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/useFetch'
import { getEnv } from '@/helpers/getEnv'
import { Link } from 'react-router-dom'
import { RouteBlogEdit } from '@/helpers/RouteName'
import { FileText, Clock, Trash2, Edit } from 'lucide-react'
import moment from 'moment'
import { showToast } from '@/helpers/showToast'
import Loading from './Loading'

const DraftsList = ({ refreshTrigger }) => {
    const [deletingId, setDeletingId] = useState(null)
    const [refresh, setRefresh] = useState(false)

    const { data: draftsData, loading, error } = useFetch(
        `${getEnv('VITE_API_BASE_URL')}/blog/drafts`,
        {
            method: 'get',
            credentials: 'include'
        },
        [refresh, refreshTrigger]
    )

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this draft?')) {
            return
        }

        try {
            setDeletingId(id)
            const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/blog/delete/${id}`, {
                method: 'delete',
                credentials: 'include'
            })

            const data = await response.json()

            if (!response.ok) {
                return showToast('error', data.message)
            }

            showToast('success', 'Draft deleted successfully')
            setRefresh(!refresh)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return <Loading />
    if (error) return <div className="text-red-500">Error loading drafts: {error.message}</div>

    const drafts = draftsData?.drafts || []

    if (drafts.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No drafts yet</p>
                    <p className="text-sm text-gray-500 mt-2">Your saved drafts will appear here</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Drafts</h2>
                <span className="text-sm text-gray-500">{drafts.length} draft(s)</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {drafts.map((draft) => (
                    <Card key={draft._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="line-clamp-2 text-lg">
                                        {draft.title || 'Untitled Draft'}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-2">
                                        <Clock className="h-3 w-3" />
                                        {moment(draft.updatedAt || draft.createdAt).fromNow()}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {draft.featuredImage && (
                                <img
                                    src={draft.featuredImage}
                                    alt={draft.title}
                                    className="w-full h-32 object-cover rounded-md mb-4"
                                />
                            )}
                            <div className="flex gap-2">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    <Link to={RouteBlogEdit(draft._id)} className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        Continue Writing
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(draft._id)}
                                    disabled={deletingId === draft._id}
                                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default DraftsList
