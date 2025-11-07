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
    RouteProfileView,
    RouteSignIn,
    RouteSignUp,
    RouteBlogDetails,
    RouteSearch,
    RouteCommentDetails,
    RouteFollowing,
    RouteFollowers,
    RouteSaved,
    RouteCategoryFeed,
    RouteUser,
} from "./helpers/RouteName";
import AddBlog from "./pages/Blog/AddBlog";
import EditBlog from "./pages/Blog/EditBlog";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Comments from "./pages/Comments";
import ProfileView from "./Pages/ProfileView";
import Following from "./Pages/Following";
import Followers from "./Pages/Followers";
import Saved from "./Pages/Saved";
import ManageUsers from "./Pages/ManageUsers";
import AddCategory from './pages/Category/AddCategory'
import CategoryDetails from './pages/Category/CategoryDetails'
import EditCategory from './pages/Category/EditCategory'
import { RouteCategoryDetails, RouteEditCategory } from "./helpers/RouteName";

import BlogDetails from "./pages/Blog/BlogDetails";
import SingleBlogDetails from "./Pages/SingleBlogDetails";
import SearchResult from "./Pages/SearchResult";
import CategoryFeed from "./Pages/CategoryFeed";

import NotificationsProvider from './context/NotificationsProvider';
import { useSelector } from 'react-redux';

function App() {
    const user = useSelector((state) => state.user);
    const loggedInUser = user?.user;

    return (
        <BrowserRouter>
            <NotificationsProvider currentUser={loggedInUser}>
                <Routes>
                    <Route path={RouteIndex} element={<Layout />}>
                    <Route index element={<Index />} />
                    <Route path={RouteProfile} element={<Profile />} />
                    <Route path={RouteProfileView()} element={<ProfileView />} />
                    <Route path={RouteFollowing} element={<Following />} />
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
                    <Route path={RouteUser} element={<ManageUsers />} />

                    {/* This is the new public blog detail route */}
                    <Route path={RouteBlogDetails()} element={<SingleBlogDetails />} />
                </Route>

                <Route path={RouteSignIn} element={<SignIn />} />
                <Route path={RouteSignUp} element={<SignUp />} />
            </Routes>
            </NotificationsProvider>
        </BrowserRouter>
    );
}

export default App;