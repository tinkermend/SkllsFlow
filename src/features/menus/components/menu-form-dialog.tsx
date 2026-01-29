import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useMenusContext } from './menus-provider';
import { menuListSchema } from '../data/schema';

const formSchema = z.object({
  name: z.string().min(1, '请输入菜单名称'),
  path: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  sort: z.coerce.number().min(0, '排序必须大于等于0'),
  type: z.enum(['menu', 'button']),
  permission: z.string().optional(),
  isVisible: z.boolean(),
  isExternal: z.boolean(),
  status: z.enum(['active', 'disabled']),
});

type FormValues = z.infer<typeof formSchema>;

export function MenuFormDialog() {
  const { selectedMenu, isFormOpen, setIsFormOpen } = useMenusContext();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      path: '',
      icon: '',
      parentId: '',
      sort: 0,
      type: 'menu',
      permission: '',
      isVisible: true,
      isExternal: false,
      status: 'active',
    },
  });

  // 获取所有菜单用于父菜单选择
  const { data: menus = [] } = useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const response = await apiClient.get('/menus');
      return menuListSchema.parse(response.data);
    },
  });

  // 扁平化菜单列表
  const flattenMenus = (menuList: typeof menus, level = 0): any[] => {
    const result: any[] = [];
    for (const menu of menuList) {
      result.push({ ...menu, level });
      if (menu.children && menu.children.length > 0) {
        result.push(...flattenMenus(menu.children, level + 1));
      }
    }
    return result;
  };

  const flatMenus = flattenMenus(menus);

  // 创建/更新菜单
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        parentId: values.parentId || null,
      };

      if (selectedMenu) {
        return apiClient.put(`/menus/${selectedMenu.id}`, payload);
      }
      return apiClient.post('/menus', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success(selectedMenu ? '菜单更新成功' : '菜单创建成功');
      setIsFormOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '操作失败');
    },
  });

  // 当选中菜单变化时，更新表单
  useEffect(() => {
    if (selectedMenu) {
      form.reset({
        name: selectedMenu.name,
        path: selectedMenu.path || '',
        icon: selectedMenu.icon || '',
        parentId: selectedMenu.parentId || '',
        sort: selectedMenu.sort,
        type: selectedMenu.type,
        permission: selectedMenu.permission || '',
        isVisible: selectedMenu.isVisible,
        isExternal: selectedMenu.isExternal,
        status: selectedMenu.status,
      });
    } else {
      form.reset();
    }
  }, [selectedMenu, form]);

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{selectedMenu ? '编辑菜单' : '新建菜单'}</DialogTitle>
          <DialogDescription>
            {selectedMenu ? '修改菜单信息' : '创建新的菜单项'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>菜单名称</FormLabel>
                    <FormControl>
                      <Input placeholder='请输入菜单名称' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='path'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>路由路径</FormLabel>
                    <FormControl>
                      <Input placeholder='/example' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='icon'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>图标</FormLabel>
                    <FormControl>
                      <Input placeholder='lucide 图标名称' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>父菜单</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                      value={field.value || 'none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='选择父菜单（可选）' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>无（顶级菜单）</SelectItem>
                        {flatMenus.map((menu) => (
                          <SelectItem
                            key={menu.id}
                            value={menu.id}
                            style={{ paddingInlineStart: `${(menu.level ?? 0) * 12 + 8}px` }}
                          >
                            {menu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='sort'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排序</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='0' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='type'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='menu'>菜单</SelectItem>
                        <SelectItem value='button'>按钮</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='permission'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>权限标识</FormLabel>
                  <FormControl>
                    <Input placeholder='例如: menu:view' {...field} />
                  </FormControl>
                  <FormDescription>
                    用于权限控制的标识符
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 md:grid-cols-3'>
              <FormField
                control={form.control}
                name='isVisible'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel>是否可见</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isExternal'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                    <div className='space-y-0.5'>
                      <FormLabel>外部链接</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='active'>启用</SelectItem>
                        <SelectItem value='disabled'>禁用</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsFormOpen(false)}
              >
                取消
              </Button>
              <Button type='submit' disabled={mutation.isPending}>
                {mutation.isPending ? '提交中...' : '确定'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
