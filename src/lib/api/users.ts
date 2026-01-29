import { apiClient } from '@/lib/api-client';
import type { User } from '@/features/users/data/schema';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const usersApi = {
  getUsers: (params: GetUsersParams) =>
    apiClient.get<GetUsersResponse>('/users', { params }),

  getUserById: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  createUser: (data: {
    accountNo: string;
    email: string;
    password: string;
    username?: string;
    avatar?: string;
    roleIds?: number[];
  }) =>
    apiClient.post<User>('/users', data),

  updateUser: (id: string, data: {
    username?: string;
    avatar?: string;
    status?: 'active' | 'disabled';
    password?: string;
  }) =>
    apiClient.put<User>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),

  assignRoles: (id: string, roleIds: number[]) =>
    apiClient.put(`/users/${id}/roles`, { roleIds }),
};
