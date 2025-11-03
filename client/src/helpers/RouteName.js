export const RouteIndex = '/'
export const RouteSignIn = "/signin";
export const RouteSignUp = "/signup";
export const RouteProfile = "/profile";
export const RouteProfileView = (userId) => {
    if (userId) {
        return `/profile/view/${userId}`;
    }
    return "/profile/view/:userId";
};
export const RouteFollowing = "/following";

// Admin Category Routes
export const RouteCategoryDetails = "/categories";
export const RouteAddCategory = "/category/add";
export const RouteEditCategory = (category_id)=>{
    if(category_id){
        return `/category/edit/${category_id}`;
    }
    else{
        return `/category/edit/:category_id`;
    }
}

// Admin Blog Routes
export const RouteBlog = '/blog'
export const RouteBlogAdd = '/blog/add'
export const RouteBlogEdit = (blogid) => {
    if (blogid) {
        return `/blog/edit/${blogid}`
    } else {
        return `/blog/edit/:blogid`
    }
}

// Public-facing Blog Detail Route
export const RouteBlogDetails = (category, blog) => {
    if (!category || !blog) {
        // This version is for the <Route> 'path' prop in App.jsx
        return '/blog/:category/:blog'
    } else {
        // This version is for the <Link> 'to' prop in BlogCard.jsx
        return `/blog/${category}/${blog}`
    }
}

export const RouteSearch = (q) => {
    if (q) {
        return `/search?q=${q}`
    } else {
        return `/search`
    }
}


export const RouteCommentDetails = '/comments'
export const RouteUser = '/users'