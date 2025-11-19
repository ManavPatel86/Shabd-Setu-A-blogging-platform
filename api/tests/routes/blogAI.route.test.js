import { describe, it, expect } from '@jest/globals'
describe('BlogAI Routes', () => {
  it('should define POST /categorize route', async () => {
    const BlogAIRoute = (await import('../../routes/blogAI.route.js')).default
    const routes = BlogAIRoute.stack.filter(r => r.route)
    const categorizeRoute = routes.find(r => r.route.path === '/categorize' && r.route.methods.post)
    expect(categorizeRoute).toBeDefined()
  })

  it('should define GET /summary/:blogId route', async () => {
    const BlogAIRoute = (await import('../../routes/blogAI.route.js')).default
    const routes = BlogAIRoute.stack.filter(r => r.route)
    const summaryRoute = routes.find(r => r.route.path === '/summary/:blogId' && r.route.methods.get)
    expect(summaryRoute).toBeDefined()
  })
})
