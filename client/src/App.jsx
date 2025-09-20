import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import { RouteSingIn, RouteSingUp } from "./helpers/RouteName";
import SignIn from "./Pages/SignIn";
import SignUp from "./Pages/SignUp";


function App() {
  return (
    <Router>
      {/* Routes */}
      <Routes>
        {/* Home Page with Buttons */}
        <Route
          path="/"
          element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
              <Button className="mb-4 bg-sky-500 py-2 px-4 rounded-full hover:bg-sky-800">
                <Link to={RouteSingIn}>Sign-in</Link>
              </Button>

              <Button className="mb-4 bg-gray-600 py-2 px-4 rounded-full hover:bg-gray-800">
                <Link to={RouteSingUp}>Sign-up</Link>
              </Button>
            </div>
          }
        />

        {/* Sign In Page */}
        <Route path={RouteSingIn} element={<SignIn />} />

        {/* Sign Up Page */}
        <Route path={RouteSingUp} element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
