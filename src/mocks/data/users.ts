/**
 * User Mock 数据
 *
 * 如何修改此文件：
 * 1. 添加新用户：在 mockUsers 数组中添加新对象
 * 2. 修改字段：直接修改对应的字段值
 * 3. 确保 id 以 'user_' 开头
 * 4. role 必须是 'admin' | 'user' | 'guest'
 * 5. email 必须是有效的邮箱格式
 * 6. avatar 字段是可选的
 *
 * 边界测试场景：
 * - user_006: 最小用户名长度（3字符）
 * - user_007: 最大用户名长度（20字符）
 * - user_008: 无头像的管理员
 * - user_009: 特殊字符用户名
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: string
}

/**
 * 用于登录验证的用户凭证
 * 注意：这些密码仅用于 Mock 环境，不应在生产环境使用
 */
export interface UserCredentials {
  accountNo: string
  email: string
  password: string
  userId: string
}

export const mockUserCredentials: UserCredentials[] = [
  {
    accountNo: 'admin',
    email: 'admin@aiops.com',
    password: 'admin123',
    userId: 'user_001',
  },
  {
    accountNo: 'user',
    email: 'user@aiops.com',
    password: 'user123',
    userId: 'user_002',
  },
  {
    accountNo: 'zhangsan',
    email: 'zhangsan@example.com',
    password: 'zhangsan123',
    userId: 'user_001',
  },
  {
    accountNo: 'lisi',
    email: 'lisi@example.com',
    password: 'lisi123',
    userId: 'user_002',
  },
]

export const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    role: UserRole.ADMIN,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
    createdAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'user_002',
    username: 'lisi',
    email: 'lisi@example.com',
    role: UserRole.USER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
    createdAt: '2024-02-20T10:15:00Z',
  },
  {
    id: 'user_003',
    username: 'wangwu',
    email: 'wangwu@example.com',
    role: UserRole.USER,
    createdAt: '2024-03-10T14:45:00Z',
  },
  {
    id: 'user_004',
    username: 'zhaoliu',
    email: 'zhaoliu@example.com',
    role: UserRole.GUEST,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu',
    createdAt: '2024-04-05T09:20:00Z',
  },
  {
    id: 'user_005',
    username: 'sunqi',
    email: 'sunqi@example.com',
    role: UserRole.ADMIN,
    createdAt: '2024-05-12T16:00:00Z',
  },
  // 边界测试数据
  {
    id: 'user_006',
    username: 'abc',
    email: 'abc@test.com',
    role: UserRole.GUEST,
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'user_007',
    username: 'very_long_username_20',
    email: 'longusername@example.com',
    role: UserRole.USER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=longuser',
    createdAt: '2024-06-05T11:30:00Z',
  },
  {
    id: 'user_008',
    username: 'admin_no_avatar',
    email: 'admin.noavatar@example.com',
    role: UserRole.ADMIN,
    createdAt: '2024-06-10T14:20:00Z',
  },
  {
    id: 'user_009',
    username: 'test_user_123',
    email: 'test.user+tag@example.com',
    role: UserRole.USER,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=special',
    createdAt: '2024-06-15T09:45:00Z',
  },
]
