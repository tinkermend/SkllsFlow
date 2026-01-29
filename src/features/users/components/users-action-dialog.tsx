"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { useCreateUser, useUpdateUser, useAssignRoles } from "../hooks/use-users";
import { toast } from "sonner";
import { type User } from "../data/schema";
import { useRolesQuery } from "@/features/roles/hooks/use-roles-query";
import { MultiSelect } from "@/components/multi-select";

const formSchema = z
  .object({
    accountNo: z.string()
      .min(3, "账号至少 3 位")
      .max(20, "账号最多 20 位")
      .regex(/^[a-zA-Z0-9_]+$/, "账号只能包含字母、数字、下划线"),
    email: z.string().email("邮箱格式不正确"),
    password: z.string().transform((pwd) => pwd.trim()),
    username: z.string().optional(),
    avatar: z.string().url("头像必须是有效的 URL").optional().or(z.literal("")),
    roleIds: z.array(z.string()).optional(),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true;
      return data.password.length > 0;
    },
    {
      message: "请输入密码",
      path: ["password"],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return password.length >= 8;
    },
    {
      message: "密码长度至少为 8 个字符",
      path: ["password"],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return /[a-z]/.test(password);
    },
    {
      message: "密码必须包含小写字母",
      path: ["password"],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true;
      return /\d/.test(password);
    },
    {
      message: "密码必须包含数字",
      path: ["password"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface UsersActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: User;
}

export function UsersActionDialog({
  open,
  onOpenChange,
  currentRow,
}: UsersActionDialogProps) {
  const isEdit = !!currentRow;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const assignRoles = useAssignRoles();
  const { data: roles = [], isLoading: isLoadingRoles } = useRolesQuery();

  // 获取当前用户的角色 ID 列表
  const currentRoleIds = currentRow?.userRoles?.map((ur) => ur.role.code) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNo: currentRow?.accountNo || "",
      email: currentRow?.email || "",
      password: "",
      username: currentRow?.username || "",
      avatar: currentRow?.avatar || "",
      roleIds: currentRoleIds,
      isEdit,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && currentRow) {
        // 更新用户基本信息
        await updateUser.mutateAsync({
          id: currentRow.userId,
          data: {
            username: data.username,
            avatar: data.avatar || undefined,
            ...(data.password && { password: data.password }),
          },
        });

        // 如果角色有变化，更新角色
        if (data.roleIds && data.roleIds.length > 0) {
          const roleIdsAsNumbers = roles
            .filter((role) => data.roleIds?.includes(role.code))
            .map((role) => Number(role.id));

          await assignRoles.mutateAsync({
            id: currentRow.userId,
            roleIds: roleIdsAsNumbers,
          });
        }

        toast.success("用户信息已更新");
      } else {
        // 创建新用户时，将角色 code 转换为 ID
        const roleIdsAsNumbers = data.roleIds
          ? roles
              .filter((role) => data.roleIds?.includes(role.code))
              .map((role) => Number(role.id))
          : [];

        await createUser.mutateAsync({
          accountNo: data.accountNo,
          email: data.email,
          password: data.password,
          username: data.username,
          avatar: data.avatar || undefined,
          roleIds: roleIdsAsNumbers.length > 0 ? roleIdsAsNumbers : undefined,
        });
        toast.success("新用户已创建");
      }
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "操作失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>{isEdit ? "编辑用户" : "添加用户"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "更新用户信息" : "创建新用户账号"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="user-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="accountNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>账号</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="请输入账号"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="请输入邮箱"
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    密码{isEdit && " (留空表示不修改)"}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder={isEdit ? "留空表示不修改" : "请输入密码"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={roles.map((role) => ({
                        label: role.name,
                        value: role.code,
                      }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="选择角色"
                      disabled={isLoadingRoles}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>头像 URL (可选)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={createUser.isPending || updateUser.isPending}
          >
            {createUser.isPending || updateUser.isPending
              ? "提交中..."
              : isEdit
                ? "更新"
                : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
