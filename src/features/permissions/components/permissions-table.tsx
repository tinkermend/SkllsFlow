import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table/data-table'
import { apiClient } from '@/lib/api-client'
import { permissionsColumns } from './permissions-columns'
import { permissionListSchema, type Permission } from '../data/schema'
import { getModules } from '@/config/permissions'

export function PermissionsTable() {
  const [moduleFilter, setModuleFilter] = useState<string[]>([])

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', moduleFilter],
    queryFn: async () => {
      const params = moduleFilter.length > 0 ? { module: moduleFilter[0] } : {}
      const response = await apiClient.get('/api/permissions', { params })
      return permissionListSchema.parse(response.data)
    },
  })

  const modules = getModules()

  return (
    <DataTable<Permission>
      columns={permissionsColumns}
      data={permissions}
      isLoading={isLoading}
      searchKey='name'
      searchPlaceholder='搜索权限名称...'
      filterColumn='module'
      filterTitle='模块'
      filterOptions={modules.map((module) => ({
        label: module,
        value: module,
      }))}
    />
  )
}
