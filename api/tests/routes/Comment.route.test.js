import { describe, it, expect } from '@jest/globals'
describe('Comment Routes', () => {
  it('should define POST /add route', async () => {
    const CommentRoute = (await import('../../routes/Comment.route.js')).default
    const routes = CommentRoute.stack.filter(r => r.route)
    const addRoute = routes.find(r => r.route.path === '/add' && r.route.methods.post)
    expect(addRoute).toBeDefined()
  })

  it('should define GET /get/:blogid route', async () => {
    const CommentRoute = (await import('../../routes/Comment.route.js')).default
    const routes = CommentRoute.stack.filter(r => r.route)
    const getRoute = routes.find(r => r.route.path === '/get/:blogid' && r.route.methods.get)
    expect(getRoute).toBeDefined()
  })

  it('should define GET /get-count/:blogid route', async () => {
    const CommentRoute = (await import('../../routes/Comment.route.js')).default
    const routes = CommentRoute.stack.filter(r => r.route)
    const getCountRoute = routes.find(r => r.route.path === '/get-count/:blogid' && r.route.methods.get)
    expect(getCountRoute).toBeDefined()
  })

  it('should define GET /get-all-comment route', async () => {
    const CommentRoute = (await import('../../routes/Comment.route.js')).default
    const routes = CommentRoute.stack.filter(r => r.route)
    const getAllRoute = routes.find(r => r.route.path === '/get-all-comment' && r.route.methods.get)
    expect(getAllRoute).toBeDefined()
  })

  it('should define DELETE /delete/:commentid route', async () => {
    const CommentRoute = (await import('../../routes/Comment.route.js')).default
    const routes = CommentRoute.stack.filter(r => r.route)
    const deleteRoute = routes.find(r => r.route.path === '/delete/:commentid' && r.route.methods.delete)
    expect(deleteRoute).toBeDefined()
  })
})
