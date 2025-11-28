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
    RouteAnalytics,
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
import AddBlog from "./pages/Blog/AddBlog";
import EditBlog from "./pages/Blog/EditBlog";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import ProfileAnalytics from './pages/ProfileAnalytics';
import Comments from "./pages/Comments";
import ProfileView from "./pages/ProfileView";
import Following from "./pages/Following";
import Help from "./pages/Help";
import Followers from "./pages/Followers";
import Saved from "./pages/Saved";
import ManageUsers from "./pages/ManageUsers";
import AdminReports from "./pages/AdminReports";
import AddCategory from './pages/Category/AddCategory'
import CategoryDetails from './pages/Category/CategoryDetails'
import EditCategory from './pages/Category/EditCategory'
import { RouteCategoryDetails, RouteEditCategory } from "./helpers/RouteName";

import BlogDetails from "./pages/Blog/BlogDetails";
import SingleBlogDetails from "./pages/SingleBlogDetails";
import SearchResult from "./pages/SearchResult";
import CategoryFeed from "./pages/CategoryFeed";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";

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

                        <Route
                            path={RouteHelp}
                            element={
                                <ProtectedRoute>
                                    <Help />
                                </ProtectedRoute>
                            }
                        />

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

                        <Route
                            path={RouteBlog}
                            element={
                                <ProtectedRoute>
                                    <BlogDetails />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteBlogEdit()}
                            element={
                                <ProtectedRoute>
                                    <EditBlog />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path={RouteSearch()}
                            element={
                                <ProtectedRoute>
                                    <SearchResult />
                                </ProtectedRoute>
                            }
                        />

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
                            path={RouteAnalytics} 
                            element={
                              <ProtectedRoute>
                                <ProfileAnalytics />
                              </ProtectedRoute>
                            }
                        />
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