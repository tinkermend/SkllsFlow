import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table/data-table";
import { apiClient } from "@/lib/api-client";
import { roleListSchema, type Role } from "../data/schema";
import { rolesColumns } from "./roles-columns";

export function RolesTable() {
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get("/roles");
      return roleListSchema.parse(response.data);
    },
  });
  const filters = [
    {
      columnId: "status",
      title: "状态",
      options: [
        { label: "启用", value: "active" },
        { label: "禁用", value: "inactive" },
      ],
    },
    {
      columnId: "isSystem",
      title: "角色类型",
      options: [
        { label: "系统内置", value: "system" },
        { label: "自定义", value: "custom" },
      ],
    },
  ];

  return (
    <DataTable<Role, Role>
      columns={rolesColumns}
      data={roles}
      isLoading={isLoading}
      searchKey="name"
      searchPlaceholder="搜索角色名称..."
      filters={filters}
    />
  );
}
