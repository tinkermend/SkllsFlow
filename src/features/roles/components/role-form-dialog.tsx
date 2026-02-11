/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { useRoles } from './roles-provider'
import { PermissionPicker } from './permission-picker'

const roleFormSchema = z.object({
  name: z.string().min(1, '请输入角色名称'),
  code: z.string().min(1, '请输入角色代码').regex(/^[a-z0-9-_]+$/, '只能包含小写字母、数字、横线和下划线'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  permissionIds: z.array(z.string()),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

export function RoleFormDialog() {
  const { open, setOpen, currentRole, setCurrentRole } = useRoles()
  const queryClient = useQueryClient()
  const isEdit = open === 'edit' && currentRole !== null

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'active',
      permissionIds: [],
    },
  })

  // 当打开编辑对话框时，填充表单数据
  useEffect(() => {
    if (isEdit && currentRole) {
      form.reset({
        name: currentRole.name,
        code: currentRole.code,
        description: currentRole.description || '',
        status: currentRole.status,
        permissionIds: currentRole.rolePermissions.map((rp) => rp.permission.id),
      })
    } else if (open === 'add') {
      form.reset({
        name: '',
        code: '',
        description: '',
        status: 'active',
        permissionIds: [],
      })
    }
  }, [open, currentRole, isEdit, form])

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      if (isEdit && currentRole) {
        return apiClient.put(`/roles/${currentRole.id}`, values)
      }
      return apiClient.post('/roles', values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(isEdit ? '角色更新成功' : '角色创建成功')
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '操作失败')
    },
  })

  const handleClose = () => {
    setOpen(null)
    setCurrentRole(null)
    form.reset()
  }

  const onSubmit = (values: RoleFormValues) => {
    mutation.mutate(values)
  }

  const isOpen = open === 'add' || open === 'edit'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色' : '创建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息和权限配置' : '创建新角色并分配权限'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色名称</FormLabel>
                  <FormControl>
                    <Input placeholder='例如：管理员' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>角色代码</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='例如：admin'
                      {...field}
                      disabled={isEdit && currentRole?.isSystem}
                    />
                  </FormControl>
                  <FormDescription>
                    用于系统内部识别，只能包含小写字母、数字、横线和下划线
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='角色描述（可选）'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择状态' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='active'>启用</SelectItem>
                      <SelectItem value='inactive'>禁用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='permissionIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>权限配置</FormLabel>
                  <PermissionPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormDescription>
                    选择该角色拥有的权限
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                取消
              </Button>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
