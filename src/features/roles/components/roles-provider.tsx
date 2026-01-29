import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { type Role } from '../data/schema'

type OpenState = 'add' | 'edit' | 'delete' | null

type RolesContextType = {
  open: OpenState
  setOpen: Dispatch<SetStateAction<OpenState>>
  currentRole: Role | null
  setCurrentRole: Dispatch<SetStateAction<Role | null>>
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

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

export function useRoles() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error('useRoles must be used within RolesProvider')
  }
  return context
}
