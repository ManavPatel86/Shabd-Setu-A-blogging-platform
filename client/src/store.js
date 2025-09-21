import { configureStore } from '@reduxjs/toolkit'
import userReducer from './redux/user/user.slice'

export default configureStore({
  reducer: { user: userReducer },
})