import { describe, it, expect } from '@jest/globals'
describe('Notification Routes', () => {
  it('should define GET / route', async () => {
    const NotificationRoute = (await import('../../routes/notification.route.js')).default
    const routes = NotificationRoute.stack.filter(r => r.route)
    const getRoute = routes.find(r => r.route.path === '/' && r.route.methods.get)
    expect(getRoute).toBeDefined()
  })

  it('should define PATCH /:id/read route', async () => {
    const NotificationRoute = (await import('../../routes/notification.route.js')).default
    const routes = NotificationRoute.stack.filter(r => r.route)
    const markReadRoute = routes.find(r => r.route.path === '/:id/read' && r.route.methods.patch)
    expect(markReadRoute).toBeDefined()
  })

  it('should define PATCH /read-all route', async () => {
    const NotificationRoute = (await import('../../routes/notification.route.js')).default
    const routes = NotificationRoute.stack.filter(r => r.route)
    const markAllReadRoute = routes.find(r => r.route.path === '/read-all' && r.route.methods.patch)
    expect(markAllReadRoute).toBeDefined()
  })

  it('should define DELETE /:id route', async () => {
    const NotificationRoute = (await import('../../routes/notification.route.js')).default
    const routes = NotificationRoute.stack.filter(r => r.route)
    const deleteRoute = routes.find(r => r.route.path === '/:id' && r.route.methods.delete)
    expect(deleteRoute).toBeDefined()
  })
})
