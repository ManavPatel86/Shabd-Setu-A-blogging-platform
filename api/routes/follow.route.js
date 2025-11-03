import express from 'express'
import { checkFollowStatus, followUser, getFollowers, getFollowing, getFollowStats, unfollowUser } from '../controllers/follow.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const FollowRoute = express.Router()

FollowRoute.use(authenticate)

FollowRoute.post('/follow/:userId', followUser)
FollowRoute.delete('/unfollow/:userId', unfollowUser)
FollowRoute.get('/followers/:userId', getFollowers)
FollowRoute.get('/following/:userId', getFollowing)
FollowRoute.get('/check/:userId', checkFollowStatus)
FollowRoute.get('/stats/:userId', getFollowStats)

export default FollowRoute
