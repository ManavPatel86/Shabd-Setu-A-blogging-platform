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
    RouteSignIn,
    RouteSignUp,
    RouteBlogDetails,
    RouteSearch,
    RouteCommentDetails
} from "./helpers/RouteName";
import AddBlog from "./pages/Blog/AddBlog";
import EditBlog from "./pages/Blog/EditBlog";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import Comments from "./pages/Comments";
import AddCategory from './pages/Category/AddCategory'
import CategoryDetails from './pages/Category/CategoryDetails'
import EditCategory from './pages/Category/EditCategory'
import { RouteCategoryDetails, RouteEditCategory } from "./helpers/RouteName";

import BlogDetails from "./pages/Blog/BlogDetails";
import SingleBlogDetails from "./Pages/SingleBlogDetails";
import SearchResult from "./Pages/SearchResult";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={RouteIndex} element={<Layout />}>
                    <Route index element={<Index />} />
                    <Route path={RouteProfile} element={<Profile />} />
                    <Route path={RouteAddCategory} element={<AddCategory />} />
                    <Route path={RouteCategoryDetails} element={<CategoryDetails />} />
                    <Route path={RouteEditCategory()} element={<EditCategory />} />

                    {/* Blog */}
                    <Route path={RouteBlogAdd} element={<AddBlog />} />
                    <Route path={RouteBlog} element={<BlogDetails />} />
                    <Route path={RouteBlogEdit()} element={<EditBlog />} />
                    <Route path={RouteSearch()} element={<SearchResult />} />

                    {/* Comments */}
                    <Route path={RouteCommentDetails} element={<Comments />} />

                    {/* This is the new public blog detail route */}
                    <Route path={RouteBlogDetails()} element={<SingleBlogDetails />} />
                </Route>

                <Route path={RouteSignIn} element={<SignIn />} />
                <Route path={RouteSignUp} element={<SignUp />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;