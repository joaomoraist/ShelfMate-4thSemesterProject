import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "./context/NavigationContext";
import "./styles/global.css";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import Home from "./pages/home";
import Statistics from "./pages/statistics";
import Products from "./pages/products";
import AddProduct from "./pages/add-product";
import Reports from "./pages/reports";
import Settings from "./pages/settings";
import SiteFooter from "./components/SiteFooter";

type Page = "login" | "signup" | "forgot-password" | "home" | "statistics" | "products" | "add-product" | "reports" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // Função para navegar entre páginas (disponível globalmente)
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  // Aplicar classe no body baseada na página atual
  React.useEffect(() => {
    const authPages = ["login", "signup", "forgot-password"];
    const isAuthPage = authPages.includes(currentPage);
    
    document.body.className = isAuthPage ? "auth-page" : "logged-in";
  }, [currentPage]);

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
      case "statistics":
        return <Statistics />;
      case "products":
        return <Products />;
      case "add-product":
        return <AddProduct />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Login />;
    }
  };

  return (
    <div className="appRoot">
      <NavigationProvider navigateTo={navigateTo}>
        <main className="appMain">
          {renderPage()}
        </main>
        <SiteFooter />
      </NavigationProvider>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
