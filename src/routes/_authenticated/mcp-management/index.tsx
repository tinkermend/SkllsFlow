import { createFileRoute } from '@tanstack/react-router';
import McpManagement from '@/features/mcp-management';

export const Route = createFileRoute('/_authenticated/mcp-management/')({
  component: McpManagement,
});
