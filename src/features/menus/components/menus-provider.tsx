import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Menu } from '../data/schema';

interface MenusContextType {
  selectedMenu: Menu | null;
  setSelectedMenu: (menu: Menu | null) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
}

const MenusContext = createContext<MenusContextType | undefined>(undefined);

export function useMenusContext() {
  const context = useContext(MenusContext);
  if (!context) {
    throw new Error('useMenusContext must be used within MenusProvider');
  }
  return context;
}

interface MenusProviderProps {
  children: ReactNode;
}

export function MenusProvider({ children }: MenusProviderProps) {
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <MenusContext.Provider
      value={{
        selectedMenu,
        setSelectedMenu,
        isFormOpen,
        setIsFormOpen,
        isDeleteOpen,
        setIsDeleteOpen,
      }}
    >
      {children}
    </MenusContext.Provider>
  );
}
