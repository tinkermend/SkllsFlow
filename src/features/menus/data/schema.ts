import { z } from 'zod';

const baseMenuSchema = z.object({
  id: z.union([z.string(), z.bigint()]).transform((val) => String(val)),
  name: z.string(),
  path: z.string().nullable(),
  icon: z.string().nullable(),
  parentId: z.union([z.string(), z.bigint(), z.null()]).transform((val) =>
    val ? String(val) : null
  ),
  sort: z.number(),
  type: z.enum(['menu', 'button']),
  permission: z.string().nullable(),
  isVisible: z.boolean(),
  isExternal: z.boolean(),
  status: z.enum(['active', 'disabled']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Menu = z.infer<typeof baseMenuSchema> & { children?: Menu[] };

export const menuSchema: z.ZodType<Menu> = baseMenuSchema.extend({
  children: z.array(z.lazy(() => menuSchema)).optional(),
});

export const menuListSchema = z.array(menuSchema);
