import { describe, it, expect } from '@jest/globals'
describe('Blog Routes', () => {
  it('should define POST /add route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const addRoute = routes.find(r => r.route.path === '/add' && r.route.methods.post)
    expect(addRoute).toBeDefined()
  })

  it('should define GET /edit/:blogid route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const editRoute = routes.find(r => r.route.path === '/edit/:blogid' && r.route.methods.get)
    expect(editRoute).toBeDefined()
  })

  it('should define PUT /update/:blogid route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const updateRoute = routes.find(r => r.route.path === '/update/:blogid' && r.route.methods.put)
    expect(updateRoute).toBeDefined()
  })

  it('should define DELETE /delete/:blogid route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const deleteRoute = routes.find(r => r.route.path === '/delete/:blogid' && r.route.methods.delete)
    expect(deleteRoute).toBeDefined()
  })

  it('should define GET /get-all route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const getAllRoute = routes.find(r => r.route.path === '/get-all' && r.route.methods.get)
    expect(getAllRoute).toBeDefined()
  })

  it('should define GET /get-blog/:slug route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const getBlogRoute = routes.find(r => r.route.path === '/get-blog/:slug' && r.route.methods.get)
    expect(getBlogRoute).toBeDefined()
  })

  it('should define GET /get-related-blog/:category/:blog route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const getRelatedRoute = routes.find(r => r.route.path === '/get-related-blog/:category/:blog' && r.route.methods.get)
    expect(getRelatedRoute).toBeDefined()
  })

  it('should define GET /get-blog-by-category/:category route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const getCategoryRoute = routes.find(r => r.route.path === '/get-blog-by-category/:category' && r.route.methods.get)
    expect(getCategoryRoute).toBeDefined()
  })

  it('should define GET /search route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const searchRoute = routes.find(r => r.route.path === '/search' && r.route.methods.get)
    expect(searchRoute).toBeDefined()
  })

  it('should define GET /author/:authorId route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const authorRoute = routes.find(r => r.route.path === '/author/:authorId' && r.route.methods.get)
    expect(authorRoute).toBeDefined()
  })

  it('should define GET /blogs route', async () => {
    const BlogRoute = (await import('../../routes/Blog.route.js')).default
    const routes = BlogRoute.stack.filter(r => r.route)
    const blogsRoute = routes.find(r => r.route.path === '/blogs' && r.route.methods.get)
    expect(blogsRoute).toBeDefined()
  })
})
