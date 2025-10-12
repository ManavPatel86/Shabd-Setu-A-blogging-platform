import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";
import { RouteAddCategory, RouteIndex, RouteProfile, RouteSignIn, RouteSignUp } from "./helpers/RouteName";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AddCategory from './pages/Category/AddCategory'
import CategoryDetails from './pages/Category/CategoryDetails'
import EditCategory from './pages/Category/EditCategory'
import { RouteCategoryDetails, RouteEditCategory } from "./helpers/RouteName";


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
                </Route>
                
                <Route path={RouteSignIn} element={<SignIn />} />
                <Route path={RouteSignUp} element={<SignUp />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
