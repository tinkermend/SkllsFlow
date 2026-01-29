import { createFileRoute } from '@tanstack/react-router'
import { AuthDebugPage } from '@/features/debug/auth-debug'

export const Route = createFileRoute('/_authenticated/debug/auth')({
  component: AuthDebugPage,
})
