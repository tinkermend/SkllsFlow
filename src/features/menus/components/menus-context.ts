import { createContext } from 'react'
import type { Menu } from '../data/schema'

export interface MenusContextType {
  selectedMenu: Menu | null
  setSelectedMenu: (menu: Menu | null) => void
  isFormOpen: boolean
  setIsFormOpen: (open: boolean) => void
  isDeleteOpen: boolean
  setIsDeleteOpen: (open: boolean) => void
}

export const MenusContext = createContext<MenusContextType | undefined>(undefined)
