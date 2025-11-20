import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";
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

import NotificationsProvider from './context/NotificationsProvider';
import { useSelector } from 'react-redux';

function App() {
    const user = useSelector((state) => state.user);
    const loggedInUser = user?.user;

    return (
        <BrowserRouter>
            <NotificationsProvider currentUser={loggedInUser}>
                <Routes>
                    <Route path={RouteLanding} element={<Landing />} />

                    <Route element={<Layout />}>
                        <Route path={RouteIndex} element={<Index />} />
                        <Route path={RouteProfile} element={<Profile />} />
                        <Route path={RouteProfileView()} element={<ProfileView />} />
                        <Route path={RouteFollowing} element={<Following />} />
                        <Route path={RouteHelp} element={<Help />} />
                        <Route path={RouteFollowers} element={<Followers />} />
                        <Route path={RouteAddCategory} element={<AddCategory />} />
                        <Route path={RouteCategoryDetails} element={<CategoryDetails />} />
                        <Route path={RouteEditCategory()} element={<EditCategory />} />

                        {/* Blog */}
                        <Route path={RouteBlogAdd} element={<AddBlog />} />
                        <Route path={RouteBlog} element={<BlogDetails />} />
                        <Route path={RouteBlogEdit()} element={<EditBlog />} />
                        <Route path={RouteSearch()} element={<SearchResult />} />
                        <Route path={RouteCategoryFeed()} element={<CategoryFeed />} />

                        {/* Comments */}
                        <Route path={RouteCommentDetails} element={<Comments />} />
                        <Route path={RouteSaved} element={<Saved />} />
                        <Route path={RouteAnalytics} element={<ProfileAnalytics />} />
                        <Route path={RouteUser} element={<ManageUsers />} />
                        <Route path={RouteAdminReports} element={<AdminReports />} />

                        {/* This is the new public blog detail route */}
                        <Route path={RouteBlogDetails()} element={<SingleBlogDetails />} />
                    </Route>

                    <Route path={RouteSignIn} element={<SignIn />} />
                    <Route path={RouteSignUp} element={<SignUp />} />
                        <Route path={RouteForgotPassword} element={<ForgotPassword />} />
            </Routes>
            </NotificationsProvider>
        </BrowserRouter>
    );
}

export default App;