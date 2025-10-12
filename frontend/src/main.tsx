import { useState } from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "./context/NavigationContext";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import Home from "./pages/home";
import Statistics from "./pages/statistics";

type Page = "login" | "signup" | "forgot-password" | "home" | "statistics";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");

  // Função para navegar entre páginas (disponível globalmente)
  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

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
      default:
        return <Login />;
    }
  };

  return (
    <NavigationProvider navigateTo={navigateTo}>
      {/* Current Page */}
      {renderPage()}
    </NavigationProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
