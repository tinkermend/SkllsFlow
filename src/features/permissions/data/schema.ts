import { z } from 'zod'

/**
 * 权限数据模型
 */
export const permissionSchema = z.object({
  id: z.union([z.string(), z.bigint()]).transform((val) => String(val)),
  code: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  module: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Permission = z.infer<typeof permissionSchema>

export const permissionListSchema = z.array(permissionSchema)
