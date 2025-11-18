import { describe, it, expect } from '@jest/globals'
describe('BlogLike Routes', () => {
  it('should define POST /do-like route', async () => {
    const BlogLikeRoute = (await import('../../routes/Bloglike.route.js')).default
    const routes = BlogLikeRoute.stack.filter(r => r.route)
    const doLikeRoute = routes.find(r => r.route.path === '/do-like' && r.route.methods.post)
    expect(doLikeRoute).toBeDefined()
  })

  it('should define GET /get-like/:blogid route', async () => {
    const BlogLikeRoute = (await import('../../routes/Bloglike.route.js')).default
    const routes = BlogLikeRoute.stack.filter(r => r.route)
    const getLikeRoute = routes.find(r => r.route.path === '/get-like/:blogid' && r.route.methods.get)
    expect(getLikeRoute).toBeDefined()
  })

  it('should define GET /get-like/:blogid/:userid route', async () => {
    const BlogLikeRoute = (await import('../../routes/Bloglike.route.js')).default
    const routes = BlogLikeRoute.stack.filter(r => r.route)
    const getLikeWithUserRoute = routes.find(r => r.route.path === '/get-like/:blogid/:userid' && r.route.methods.get)
    expect(getLikeWithUserRoute).toBeDefined()
  })
})
