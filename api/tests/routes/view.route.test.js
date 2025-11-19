import { describe, it, expect } from '@jest/globals'
describe('View Routes', () => {
  it('should define POST /add-view route', async () => {
    const ViewRoute = (await import('../../routes/view.route.js')).default
    const routes = ViewRoute.stack.filter(r => r.route)
    const addViewRoute = routes.find(r => r.route.path === '/add-view' && r.route.methods.post)
    expect(addViewRoute).toBeDefined()
  })

  it('should define GET /:blogId route', async () => {
    const ViewRoute = (await import('../../routes/view.route.js')).default
    const routes = ViewRoute.stack.filter(r => r.route)
    const getViewRoute = routes.find(r => r.route.path === '/:blogId' && r.route.methods.get)
    expect(getViewRoute).toBeDefined()
  })
})
