import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnFiltersState } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { apiClient } from "@/lib/api-client";
import { permissionsColumns } from "./permissions-columns";
import { permissionListSchema, type Permission } from "../data/schema";
import { getModules } from "@/config/permissions";

export function PermissionsTable() {
  const [moduleFilter, setModuleFilter] = useState<string[]>([]);

  const activeModule = moduleFilter[0] ?? null;
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions", activeModule],
    queryFn: async () => {
      const params = activeModule ? { module: activeModule } : {};
      const response = await apiClient.get("/permissions", { params });
      return permissionListSchema.parse(response.data);
    },
  });
  const handleFilterChange = useCallback((filters: ColumnFiltersState) => {
    const moduleFilterValue =
      (filters.find((filter) => filter.id === "module")?.value as string[]) ??
      [];
    setModuleFilter(moduleFilterValue);
  }, []);
  const modules = getModules();

  return (
    <DataTable<Permission, Permission>
      columns={permissionsColumns}
      data={permissions}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="搜索权限名称..."
      filters={[
        {
          columnId: "module",
          title: "模块",
          options: modules.map((module) => ({
            label: module,
            value: module,
          })),
        },
      ]}
      onColumnFiltersChange={handleFilterChange}
    />
  );
}
