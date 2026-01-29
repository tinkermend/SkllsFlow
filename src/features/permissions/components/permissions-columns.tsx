import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table";
import { type Permission } from "../data/schema";

export const permissionsColumns: ColumnDef<Permission>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="权限名称" />
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
    },
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="权限代码" />
    ),
    cell: ({ row }) => {
      return (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.getValue("code")}
        </code>
      );
    },
  },
  {
    accessorKey: "module",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="所属模块" />
    ),
    cell: ({ row }) => {
      return <Badge variant="secondary">{row.getValue("module")}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "resource",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="资源" />
    ),
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("resource")}</div>;
    },
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="操作" />
    ),
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("action")}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "描述",
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="max-w-[300px] truncate text-sm text-muted-foreground">
          {description || "-"}
        </div>
      );
    },
    enableSorting: false,
  },
];
