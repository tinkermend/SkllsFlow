import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table'
import { apiClient } from '@/lib/api-client'
import { roleListSchema, type Role } from '../data/schema'
import { rolesColumns } from './roles-columns'

export function RolesTable() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get('/api/roles')
      return roleListSchema.parse(response.data)
    },
  })

  return (
    <DataTable<Role>
      columns={rolesColumns}
      data={roles}
      isLoading={isLoading}
      searchKey='name'
      searchPlaceholder='搜索角色名称...'
    />
  )
}
