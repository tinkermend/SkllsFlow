import { createFileRoute } from '@tanstack/react-router'
import { PermissionsPage } from '@/features/permissions'

export const Route = createFileRoute('/_authenticated/settings/permissions/')({
  component: PermissionsPage,
})
