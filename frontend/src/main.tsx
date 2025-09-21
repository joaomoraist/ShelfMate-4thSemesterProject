import React, { useState } from "react";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import Home from "./pages/home";

type Page = "login" | "signup" | "forgot-password" | "home";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login />;
      case "signup":
        return <Signup />;
      case "forgot-password":
        return <ForgotPassword />;
      case "home":
        return <Home />;
      default:
        return <Login />;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Navigation */}
      <nav style={{ marginBottom: "30px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
        <button 
          onClick={() => setCurrentPage("login")}
          style={{ margin: "5px", padding: "8px 16px" }}
        >
          🔐 Login
        </button>
        <button 
          onClick={() => setCurrentPage("signup")}
          style={{ margin: "5px", padding: "8px 16px" }}
        >
          📝 Sign Up
        </button>
        <button 
          onClick={() => setCurrentPage("forgot-password")}
          style={{ margin: "5px", padding: "8px 16px" }}
        >
          🔑 Forgot Password
        </button>
        <button 
          onClick={() => setCurrentPage("home")}
          style={{ margin: "5px", padding: "8px 16px" }}
        >
          🏠 Home
        </button>
      </nav>

      {/* Current Page */}
      {renderPage()}
    </div>
  );
}

export default App;
