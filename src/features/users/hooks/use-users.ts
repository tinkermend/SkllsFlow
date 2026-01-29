import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type GetUsersParams } from '@/lib/api/users';

export function useUsers(params: GetUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers(params).then(res => res.data),
    keepPreviousData: true,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(id).then(res => res.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: number[] }) =>
      usersApi.assignRoles(id, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
