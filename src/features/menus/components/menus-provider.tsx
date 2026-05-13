import { useState, type ReactNode } from 'react';
import type { Menu } from '../data/schema';
import { MenusContext } from './menus-context';

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
