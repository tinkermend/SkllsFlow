import { useContext } from 'react'
import { RolesContext } from './roles-context'

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles must be used within RolesProvider')
  }
  return context
}
