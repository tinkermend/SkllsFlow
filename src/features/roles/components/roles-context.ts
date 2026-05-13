import { createContext, type Dispatch, type SetStateAction } from 'react'
import { type Role } from '../data/schema'

export type OpenState = 'add' | 'edit' | 'delete' | null

export type RolesContextType = {
  open: OpenState
  setOpen: Dispatch<SetStateAction<OpenState>>
  currentRole: Role | null
  setCurrentRole: Dispatch<SetStateAction<Role | null>>
}

export const RolesContext = createContext<RolesContextType | undefined>(undefined)
