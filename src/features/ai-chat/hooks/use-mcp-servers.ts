import { useQuery } from '@tanstack/react-query'
import type { McpServer } from '../types'

/**
 * [预留] MCP 服务器列表 Hook
 * 后续对接 MCP 相关接口
 */
export function useMcpServers() {
  return useQuery({
    queryKey: ['ai-chat', 'mcp-servers'],
    queryFn: async (): Promise<McpServer[]> => {
      // [预留] 后续对接 MCP 服务器接口
      return []
    },
    enabled: false, // 当前禁用，后续开启
  })
}
