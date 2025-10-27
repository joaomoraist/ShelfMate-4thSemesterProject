import React, { createContext, useContext, ReactNode } from 'react';

type Page = "login" | "signup" | "forgot-password" | "home" | "statistics" | "products" | "add-product" | "reports" | "settings";

interface NavigationContextType {
  navigateTo: (page: Page) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
  navigateTo: (page: Page) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children, navigateTo }) => {
  return (
    <NavigationContext.Provider value={{ navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

