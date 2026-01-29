import { createFileRoute } from '@tanstack/react-router'
import { RolesPage } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/settings/roles/')({
  component: RolesPage,
})
