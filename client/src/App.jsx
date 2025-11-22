import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import {
    RouteAddCategory,
    RouteBlogAdd,
    RouteBlog,
    RouteBlogEdit,
    RouteIndex,
    RouteProfile,
    RouteProfileView,
    RouteSignIn,
    RouteSignUp,
    RouteForgotPassword,
    RouteBlogDetails,
    RouteSearch,
    RouteCommentDetails,
    RouteFollowing,
    RouteHelp,
    RouteFollowers,
    RouteSaved,
    RouteCategoryFeed,
    RouteUser,
    RouteLanding,
    RouteAdminReports,
} from "./helpers/RouteName";
import AddBlog from "./Pages/Blog/AddBlog";
import EditBlog from "./Pages/Blog/EditBlog";
import Index from "./Pages/Index";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import Profile from "./Pages/Profile";
import Comments from "./Pages/Comments";
import ProfileView from "./Pages/ProfileView";
import Following from "./Pages/Following";
import Help from "./Pages/Help";
import Followers from "./Pages/Followers";
import Saved from "./Pages/Saved";
import ManageUsers from "./Pages/ManageUsers";
import AdminReports from "./Pages/AdminReports";
import AddCategory from './Pages/Category/AddCategory'
import CategoryDetails from './Pages/Category/CategoryDetails'
import EditCategory from './Pages/Category/EditCategory'
import { RouteCategoryDetails, RouteEditCategory } from "./helpers/RouteName";

import BlogDetails from "./Pages/Blog/BlogDetails";
import SingleBlogDetails from "./Pages/SingleBlogDetails";
import SearchResult from "./Pages/SearchResult";
import CategoryFeed from "./Pages/CategoryFeed";
import Landing from "./Pages/Landing";
import ForgotPassword from "./Pages/ForgotPassword";

import NotificationsProvider from './context/NotificationsProvider';function App() {
    return (
        <BrowserRouter>
            <NotificationsProvider>
                <Routes>

                    {/* Public Pages */}
                    <Route path={RouteLanding} element={<Landing />} />
                    <Route path={RouteSignIn} element={<SignIn />} />
                    <Route path={RouteSignUp} element={<SignUp />} />
                    <Route path={RouteForgotPassword} element={<ForgotPassword />} />

                    {/* Protected Pages */}
                    <Route element={<Layout />}>

                        <Route
                            path={RouteIndex}
                            element={
                                <ProtectedRoute>
                                    <Index />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteProfile}
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteProfileView()}
                            element={
                                <ProtectedRoute>
                                    <ProfileView />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteFollowing}
                            element={
                                <ProtectedRoute>
                                    <Following />
                                </ProtectedRoute>
                            }
                        />

                        {/* <Route
                            path={RouteHelp}
                            element={
                                <ProtectedRoute>
                                    <Help />
                                </ProtectedRoute>
                            }
                        /> */}

                        <Route
                            path={RouteFollowers}
                            element={
                                <ProtectedRoute>
                                    <Followers />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteAddCategory}
                            element={
                                <ProtectedRoute>
                                    <AddCategory />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteCategoryDetails}
                            element={
                                <ProtectedRoute>
                                    <CategoryDetails />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteEditCategory()}
                            element={
                                <ProtectedRoute>
                                    <EditCategory />
                                </ProtectedRoute>
                            }
                        />

                        {/* Blog */}
                        <Route
                            path={RouteBlogAdd}
                            element={
                                <ProtectedRoute>
                                    <AddBlog />
                                </ProtectedRoute>
                            }
                        />

                        {/* <Route
                            path={RouteBlog}
                            element={
                                <ProtectedRoute>
                                    <BlogDetails />
                                </ProtectedRoute>
                            }
                        /> */}

                        <Route
                            path={RouteBlogEdit()}
                            element={
                                <ProtectedRoute>
                                    <EditBlog />
                                </ProtectedRoute>
                            }
                        />

                        {/* <Route
                            path={RouteSearch()}
                            element={
                                <ProtectedRoute>
                                    <SearchResult />
                                </ProtectedRoute>
                            }
                        /> */}

                        <Route
                            path={RouteCategoryFeed()}
                            element={
                                <ProtectedRoute>
                                    <CategoryFeed />
                                </ProtectedRoute>
                            }
                        />

                        {/* Comments */}
                        <Route
                            path={RouteCommentDetails}
                            element={
                                <ProtectedRoute>
                                    <Comments />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteSaved}
                            element={
                                <ProtectedRoute>
                                    <Saved />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteUser}
                            element={
                                <ProtectedRoute>
                                    <ManageUsers />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteAdminReports}
                            element={
                                <ProtectedRoute>
                                    <AdminReports />
                                </ProtectedRoute>
                            }
                        />

                        {/* Public Blog */}
                        <Route path={RouteBlogDetails()} element={<SingleBlogDetails />} />

                    </Route>
                </Routes>
            </NotificationsProvider>
        </BrowserRouter>
    );
}
export default App;