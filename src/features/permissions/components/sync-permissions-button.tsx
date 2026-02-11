/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { PERMISSIONS } from "@/config/permissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SyncPermissionsButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post("/permissions/sync", {
        permissions: PERMISSIONS,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("权限同步成功");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "同步失败");
    },
  });

  const handleSync = () => {
    mutation.mutate();
  };

  return (
    <>
      <PermissionGuard permission="permission:sync">
        <Button onClick={() => setOpen(true)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          同步权限
        </Button>
      </PermissionGuard>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认同步权限</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将从配置文件 <code>src/config/permissions.ts</code>{" "}
              同步权限到数据库。
              <br />
              <br />共 <strong>{PERMISSIONS.length}</strong> 个权限将被同步。
              <br />
              已存在的权限将被更新，新权限将被创建。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSync}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "同步中..." : "确认同步"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
