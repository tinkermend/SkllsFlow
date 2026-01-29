import { z } from "zod";

// 角色状态 Schema
const roleStatusSchema = z.union([z.literal("active"), z.literal("inactive")]);
export type RoleStatus = z.infer<typeof roleStatusSchema>;

// 权限 Schema
const permissionSchema = z.object({
  id: z.union([z.string(), z.bigint()]).transform((val) => String(val)),
  name: z.string(),
  code: z.string(),
  resource: z.string(),
  action: z.string(),
  module: z.string(),
  description: z.string().nullable(),
});
export type Permission = z.infer<typeof permissionSchema>;

// 角色权限关联 Schema
const rolePermissionSchema = z.object({
  permission: permissionSchema,
});

// 角色 Schema (匹配后端 API 返回结构)
const roleSchema = z.object({
  id: z.union([z.string(), z.bigint()]).transform((val) => String(val)),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  sort: z.number(),
  status: roleStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  rolePermissions: z.array(rolePermissionSchema),
});
export type Role = z.infer<typeof roleSchema>;

export const roleListSchema = z.array(roleSchema);
