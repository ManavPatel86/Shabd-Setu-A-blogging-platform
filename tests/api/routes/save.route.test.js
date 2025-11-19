import { describe, it, expect } from '@jest/globals'
describe('Save Routes', () => {
  it('should define POST /toggle/:blogId route', async () => {
    const SaveRoute = (await import('../../routes/save.route.js')).default
    const routes = SaveRoute.stack.filter(r => r.route)
    const toggleRoute = routes.find(r => r.route.path === '/toggle/:blogId' && r.route.methods.post)
    expect(toggleRoute).toBeDefined()
  })

  it('should define GET /status/:blogId route', async () => {
    const SaveRoute = (await import('../../routes/save.route.js')).default
    const routes = SaveRoute.stack.filter(r => r.route)
    const statusRoute = routes.find(r => r.route.path === '/status/:blogId' && r.route.methods.get)
    expect(statusRoute).toBeDefined()
  })

  it('should define GET / route', async () => {
    const SaveRoute = (await import('../../routes/save.route.js')).default
    const routes = SaveRoute.stack.filter(r => r.route)
    const getRoute = routes.find(r => r.route.path === '/' && r.route.methods.get)
    expect(getRoute).toBeDefined()
  })
})
