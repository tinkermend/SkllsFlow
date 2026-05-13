import { useState, type ReactNode } from 'react'
import { type Role } from '../data/schema'
import { type OpenState, RolesContext } from './roles-context'

export function RolesProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<OpenState>(null)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)

  return (
    <RolesContext.Provider
      value={{ open, setOpen, currentRole, setCurrentRole }}
    >
      {children}
    </RolesContext.Provider>
  )
}
