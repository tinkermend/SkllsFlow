import { createFileRoute } from '@tanstack/react-router'
import { AgentManagementPage } from '@/features/agent-management'

export const Route = createFileRoute('/_authenticated/agent-management/')({
  component: AgentManagementPage,
})
