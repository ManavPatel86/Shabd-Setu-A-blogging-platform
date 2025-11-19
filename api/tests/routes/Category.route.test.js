import { describe, it, expect } from '@jest/globals'
describe('Category Routes', () => {
  it('should define POST /add route', async () => {
    const CategoryRoute = (await import('../../routes/Category.route.js')).default
    const routes = CategoryRoute.stack.filter(r => r.route)
    const addRoute = routes.find(r => r.route.path === '/add' && r.route.methods.post)
    expect(addRoute).toBeDefined()
  })

  it('should define PUT /update/:categoryid route', async () => {
    const CategoryRoute = (await import('../../routes/Category.route.js')).default
    const routes = CategoryRoute.stack.filter(r => r.route)
    const updateRoute = routes.find(r => r.route.path === '/update/:categoryid' && r.route.methods.put)
    expect(updateRoute).toBeDefined()
  })

  it('should define GET /show/:categoryid route', async () => {
    const CategoryRoute = (await import('../../routes/Category.route.js')).default
    const routes = CategoryRoute.stack.filter(r => r.route)
    const showRoute = routes.find(r => r.route.path === '/show/:categoryid' && r.route.methods.get)
    expect(showRoute).toBeDefined()
  })

  it('should define DELETE /delete/:categoryid route', async () => {
    const CategoryRoute = (await import('../../routes/Category.route.js')).default
    const routes = CategoryRoute.stack.filter(r => r.route)
    const deleteRoute = routes.find(r => r.route.path === '/delete/:categoryid' && r.route.methods.delete)
    expect(deleteRoute).toBeDefined()
  })

  it('should define GET /all-category route', async () => {
    const CategoryRoute = (await import('../../routes/Category.route.js')).default
    const routes = CategoryRoute.stack.filter(r => r.route)
    const allCategoryRoute = routes.find(r => r.route.path === '/all-category' && r.route.methods.get)
    expect(allCategoryRoute).toBeDefined()
  })
})
