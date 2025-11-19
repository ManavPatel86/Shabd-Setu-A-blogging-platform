import { describe, it, expect } from '@jest/globals'
describe('Auth Routes', () => {
  it('should define POST /register route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const registerRoute = routes.find(r => r.route.path === '/register' && r.route.methods.post)
    expect(registerRoute).toBeDefined()
  })

  it('should define POST /login route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const loginRoute = routes.find(r => r.route.path === '/login' && r.route.methods.post)
    expect(loginRoute).toBeDefined()
  })

  it('should define POST /google-login route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const googleLoginRoute = routes.find(r => r.route.path === '/google-login' && r.route.methods.post)
    expect(googleLoginRoute).toBeDefined()
  })

  it('should define GET /logout route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const logoutRoute = routes.find(r => r.route.path === '/logout' && r.route.methods.get)
    expect(logoutRoute).toBeDefined()
  })

  it('should define POST /verify-otp route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const verifyOtpRoute = routes.find(r => r.route.path === '/verify-otp' && r.route.methods.post)
    expect(verifyOtpRoute).toBeDefined()
  })

  it('should define POST /resend-otp route', async () => {
    const AuthRoute = (await import('../../routes/Auth.route.js')).default
    const routes = AuthRoute.stack.filter(r => r.route)
    const resendOtpRoute = routes.find(r => r.route.path === '/resend-otp' && r.route.methods.post)
    expect(resendOtpRoute).toBeDefined()
  })
})
