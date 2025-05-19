import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./store/features/auth/authSlice";
import LoginPage from "./pages/common/LoginPage/LoginPage";
import "./App.css";

// Configure the Redux store with the auth reducer
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Add placeholder for registration page */}
          <Route path="/registrationpage" element={<div>Registration Page</div>} />
          {/* Redirect root to login page */}
          <Route path="/" element={<Navigate replace to="/login" />} />
          {/* Add a catch-all route for 404 */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
