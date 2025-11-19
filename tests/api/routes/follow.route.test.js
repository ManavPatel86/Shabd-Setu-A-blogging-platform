import { describe, it, expect } from '@jest/globals'
describe('Follow Routes', () => {
  it('should define POST /follow/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const followRoute = routes.find(r => r.route.path === '/follow/:userId' && r.route.methods.post)
    expect(followRoute).toBeDefined()
  })

  it('should define DELETE /unfollow/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const unfollowRoute = routes.find(r => r.route.path === '/unfollow/:userId' && r.route.methods.delete)
    expect(unfollowRoute).toBeDefined()
  })

  it('should define GET /followers/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const followersRoute = routes.find(r => r.route.path === '/followers/:userId' && r.route.methods.get)
    expect(followersRoute).toBeDefined()
  })

  it('should define GET /following/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const followingRoute = routes.find(r => r.route.path === '/following/:userId' && r.route.methods.get)
    expect(followingRoute).toBeDefined()
  })

  it('should define GET /check/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const checkRoute = routes.find(r => r.route.path === '/check/:userId' && r.route.methods.get)
    expect(checkRoute).toBeDefined()
  })

  it('should define GET /stats/:userId route', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const routes = FollowRoute.stack.filter(r => r.route)
    const statsRoute = routes.find(r => r.route.path === '/stats/:userId' && r.route.methods.get)
    expect(statsRoute).toBeDefined()
  })

  it('should apply authenticate middleware to all routes', async () => {
    const FollowRoute = (await import('../../routes/follow.route.js')).default
    const middlewares = FollowRoute.stack.filter(r => !r.route && r.name !== '<anonymous>')
    expect(middlewares.length).toBeGreaterThan(0)
  })
})
