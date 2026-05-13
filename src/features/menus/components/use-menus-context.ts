import { useContext } from 'react'
import { MenusContext } from './menus-context'

export function useMenusContext() {
  const context = useContext(MenusContext)
  if (!context) {
    throw new Error('useMenusContext must be used within MenusProvider')
  }
  return context
}
