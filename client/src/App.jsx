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
import AddBlog from "./Pages/Blog/AddBlog";
import EditBlog from "./Pages/Blog/EditBlog";
import Index from "./Pages/Index";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";
import Profile from "./Pages/Profile";
import ProfileAnalytics from './pages/ProfileAnalytics';
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