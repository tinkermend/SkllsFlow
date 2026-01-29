import { createContext, useContext } from 'react'
import { type AppAbility } from '@/lib/ability'

export const AbilityContext = createContext<AppAbility | null>(null)

export function useAbility() {
  const ability = useContext(AbilityContext)

  if (!ability) {
    throw new Error('useAbility must be used within AbilityProvider')
  }

  return ability
}
