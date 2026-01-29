import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

// 角色 Schema
const roleSchema = z.object({
  name: z.string(),
  code: z.string(),
})

// 用户角色关联 Schema
const userRoleSchema = z.object({
  role: roleSchema,
})

// 用户 Schema (匹配后端 API 返回结构)
const userSchema = z.object({
  userId: z.string(),  // 改为 UUID (对外 API)
  accountNo: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  avatar: z.string().nullable(),
  status: userStatusSchema,
  lastLoginAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  userRoles: z.array(userRoleSchema),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
