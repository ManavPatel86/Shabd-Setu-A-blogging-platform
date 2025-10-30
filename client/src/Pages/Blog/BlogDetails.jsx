import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { RouteBlogAdd} from '@/helpers/RouteName'
import Comments from '@/components/Comments'

const BlogDetails = () => {
  return (
    <div className="mt-9">
          <Card> 
            <CardHeader>
              <div>
                <Button asChild>
                  <Link to={RouteBlogAdd}>
                    Add Blog
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead >Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Dated</TableHead>
                    <TableHead>Action</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {/* {categoryData && categoryData.category.length > 0 ?
    
                        categoryData.category.map(category =>
                            <TableRow key={category._id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.slug}</TableCell>
                                <TableCell className="flex gap-3">
                                    <Button variant="outline" className="hover:bg-violet-500 hover:text-white" asChild>
                                        <Link to={RouteEditCategory(category._id)}>
                                            <FiEdit />
                                        </Link>
                                    </Button>
                                    <Button onClick={() => handleDelete(category._id)} variant="outline" className="hover:bg-violet-500 hover:text-white" >
                                        <FaRegTrashAlt />
                                    </Button>
                                </TableCell>
                            </TableRow>
    
                        )
    
                        :
    
                        <TableRow>
                            <TableCell colSpan="3">
                                Data not found.
                            </TableCell>
                        </TableRow>
                    } */}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>  


  )
}


export default BlogDetails