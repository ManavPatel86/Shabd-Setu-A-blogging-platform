import { describe, it, expect } from '@jest/globals'
describe('User Routes', () => {
  it('should define GET /get-user/:userid route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const getUserRoute = routes.find(r => r.route.path === '/get-user/:userid' && r.route.methods.get)
    expect(getUserRoute).toBeDefined()
  })

  it('should define GET /profile-overview/:userid route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const profileRoute = routes.find(r => r.route.path === '/profile-overview/:userid' && r.route.methods.get)
    expect(profileRoute).toBeDefined()
  })

  it('should define GET /contributions/:userid route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const contributionsRoute = routes.find(r => r.route.path === '/contributions/:userid' && r.route.methods.get)
    expect(contributionsRoute).toBeDefined()
  })

  it('should define PUT /update-user/:userid route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const updateRoute = routes.find(r => r.route.path === '/update-user/:userid' && r.route.methods.put)
    expect(updateRoute).toBeDefined()
  })

  it('should define GET /get-all-user route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const getAllRoute = routes.find(r => r.route.path === '/get-all-user' && r.route.methods.get)
    expect(getAllRoute).toBeDefined()
  })

  it('should define DELETE /delete/:id route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const deleteRoute = routes.find(r => r.route.path === '/delete/:id' && r.route.methods.delete)
    expect(deleteRoute).toBeDefined()
  })

  it('should define PATCH /blacklist/:userid route', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const routes = UserRoute.stack.filter(r => r.route)
    const blacklistRoute = routes.find(r => r.route.path === '/blacklist/:userid' && r.route.methods.patch)
    expect(blacklistRoute).toBeDefined()
  })

  it('should apply authenticate middleware to all routes', async () => {
    const UserRoute = (await import('../../routes/User.route.js')).default
    const middlewares = UserRoute.stack.filter(r => !r.route && r.name !== '<anonymous>')
    expect(middlewares.length).toBeGreaterThan(0)
  })
})
