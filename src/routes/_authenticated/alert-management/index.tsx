import { createFileRoute } from '@tanstack/react-router'
import { UnderDevelopment } from '@/components/under-development'

export const Route = createFileRoute('/_authenticated/alert-management/')({
  component: UnderDevelopment,
})
