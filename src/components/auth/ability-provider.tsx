import { ReactNode } from 'react'
import { AbilityContext } from '@/context/ability-context'
import { defineAbilityFor } from '@/lib/ability'
import { useAuthStore } from '@/stores/auth-store'

interface AbilityProviderProps {
  children: ReactNode
}

export function AbilityProvider({ children }: AbilityProviderProps) {
  const { auth } = useAuthStore()

  const ability = defineAbilityFor(auth.user?.permissions || [])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}
