import { useQuery } from '@tanstack/react-query'
import type { Skill } from '../types'

/**
 * [预留] Skills 列表 Hook
 * 后续对接 GET /agent 接口
 */
export function useAvailableSkills() {
  return useQuery({
    queryKey: ['ai-chat', 'skills'],
    queryFn: async (): Promise<Skill[]> => {
      // [预留] 后续对接 GET /agent
      // const client = getOpenCodeClient()
      // const response = await client.get('/agent')
      // return response.data
      return []
    },
    enabled: false, // 当前禁用，后续开启
  })
}
