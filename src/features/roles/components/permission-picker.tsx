import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/api-client";
import { type Permission } from "../data/schema";

type PermissionPickerProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function PermissionPicker({ value, onChange }: PermissionPickerProps) {
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await apiClient.get("/permissions");
      return response.data as Permission[];
    },
  });

  // 按模块分组权限 - 使用 useMemo 避免每次渲染都重新创建对象
  const groupedPermissions = useMemo(() => {
    return permissions.reduce(
      (acc, permission) => {
        const module = permission.module || "其他";
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );
  }, [permissions]);

  const modules = useMemo(() => {
    return Object.keys(groupedPermissions).sort();
  }, [groupedPermissions]);

  const handleTogglePermission = (permissionId: string) => {
    if (value.includes(permissionId)) {
      onChange(value.filter((id) => id !== permissionId));
    } else {
      onChange([...value, permissionId]);
    }
  };

  const handleToggleModule = (module: string) => {
    const modulePermissions = groupedPermissions[module];
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const allSelected = modulePermissionIds.every((id) => value.includes(id));

    if (allSelected) {
      onChange(value.filter((id) => !modulePermissionIds.includes(id)));
    } else {
      const newValue = [...value];
      modulePermissionIds.forEach((id) => {
        if (!newValue.includes(id)) {
          newValue.push(id);
        }
      });
      onChange(newValue);
    }
  };

  const toggleModuleVisibility = (module: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">加载权限列表...</div>;
  }

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="text-sm font-medium">已选择 {value.length} 个权限</div>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            清空
          </button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          {modules.map((module) => {
            const modulePermissions = groupedPermissions[module];
            const modulePermissionIds = modulePermissions.map((p) => p.id);
            const selectedCount = modulePermissionIds.filter((id) =>
              value.includes(id),
            ).length;
            const allSelected = selectedCount === modulePermissionIds.length;
            const someSelected = selectedCount > 0 && !allSelected;

            const isCollapsed = collapsedModules[module] ?? false;
            return (
              <div key={module} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => handleToggleModule(module)}
                  />
                  <button
                    type="button"
                    onClick={() => toggleModuleVisibility(module)}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                    {module}
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}/{modulePermissionIds.length}
                    </Badge>
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="ml-6 space-y-2">
                    {modulePermissions.map((permission) => {
                      const isSelected = value.includes(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-md hover:bg-muted/50",
                            isSelected && "bg-muted",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {permission.name}
                              </span>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {permission.code}
                              </code>
                            </div>
                            {permission.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
