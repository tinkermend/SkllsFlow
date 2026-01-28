# AIOps 平台 RBAC + 用户认证实施方案 (轻量级方案)

## 📋 方案概述

**技术选型**:

- **后端**: 自定义 RBAC (基于 Prisma + Repository 模式)
- **前端**: CASL (`@casl/ability` + `@casl/react`)
- **认证**: JWT (Access Token + Refresh Token)
- **密码**: bcrypt 加密

**方案优势**:

- ✅ 与现有架构完美契合 (Prisma + Repository)
- ✅ 零学习成本 (无需学习 Casbin 配置)
- ✅ 性能最优 (直接数据库查询)
- ✅ 类型安全 (TypeScript 全链路)
- ✅ 易维护 (代码即文档)

---

## 🗄️ 第一阶段: 数据库层设计

### 1.1 Prisma Schema 定义

**文件**: [`prisma/schema.prisma`](../prisma/schema.prisma)

```prisma
// ============================================
// 用户表
// ============================================
model User {
  id           BigInt      @id @default(autoincrement())
  accountNo    String      @unique @map("account_no")      // 账号
  email        String      @unique                          // 邮箱
  passwordHash String      @map("password_hash")            // 密码哈希
  username     String?                                      // 用户名
  avatar       String?                                      // 头像 URL
  status       user_status @default(active)                 // 状态
  lastLoginAt  DateTime?   @map("last_login_at")            // 最后登录时间
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  // 关联关系
  userRoles     UserRole[]
  refreshTokens RefreshToken[]
  sessions      Session[]

  @@index([status])
  @@index([accountNo])
  @@index([email])
  @@schema("aiops")
  @@map("users")
}

enum user_status {
  active      // 激活
  disabled    // 禁用

  @@schema("aiops")
}

// ============================================
// 角色表
// ============================================
model Role {
  id          BigInt       @id @default(autoincrement())
  name        String                                          // 角色名称
  code        String       @unique                            // 角色代码 (admin, user)
  description String?                                         // 角色描述
  isSystem    Boolean      @default(false) @map("is_system")  // 是否系统内置
  sort        Int          @default(0)                        // 排序
  status      role_status  @default(active)                   // 状态
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  // 关联关系
  userRoles     UserRole[]
  rolePermissions RolePermission[]

  @@index([code])
  @@index([status])
  @@schema("aiops")
  @@map("roles")
}

enum role_status {
  active      // 激活
  disabled    // 禁用

  @@schema("aiops")
}

// ============================================
// 权限表
// ============================================
model Permission {
  id          BigInt   @id @default(autoincrement())
  name        String                                          // 权限名称
  code        String   @unique                                // 权限代码 (user:create)
  resource    String                                          // 资源 (user, session)
  action      String                                          // 操作 (create, read, update, delete)
  description String?                                         // 权限描述
  module      String                                          // 所属模块 (users, sessions, skills)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 关联关系
  rolePermissions RolePermission[]

  @@index([module])
  @@index([code])
  @@schema("aiops")
  @@map("permissions")
}

// ============================================
// 用户-角色关联表 (多对多)
// ============================================
model UserRole {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  roleId    BigInt   @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@schema("aiops")
  @@map("user_roles")
}

// ============================================
// 角色-权限关联表 (多对多)
// ============================================
model RolePermission {
  id           BigInt   @id @default(autoincrement())
  roleId       BigInt   @map("role_id")
  permissionId BigInt   @map("permission_id")
  createdAt    DateTime @default(now()) @map("created_at")

  // 关联关系
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@schema("aiops")
  @@map("role_permissions")
}

// ============================================
// 刷新令牌表
// ============================================
model RefreshToken {
  id           BigInt    @id @default(autoincrement())
  tokenHash    String    @unique @map("token_hash")          // 经过哈希的刷新令牌
  deviceId     String?   @map("device_id")                   // 设备指纹
  ipAddress    String?   @map("ip_address")                  // 登录 IP
  userAgent    String?   @map("user_agent")                  // UA
  userId       BigInt    @map("user_id")
  expiresAt    DateTime  @map("expires_at")                  // 过期时间
  createdAt    DateTime  @default(now()) @map("created_at")
  rotatedAt    DateTime? @map("rotated_at")                  // 轮换时间
  revokedAt    DateTime? @map("revoked_at")                  // 撤销时间

  // 关联关系
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deviceId])
  @@schema("aiops")
  @@map("refresh_tokens")
}

// ============================================
// 审计日志表 (可选)
// ============================================
model AuditLog {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt?  @map("user_id")
  action    String                                          // 操作类型 (login, create_user, etc.)
  resource  String                                          // 资源类型
  resourceId String? @map("resource_id")                     // 资源 ID
  details   Json?                                           // 操作详情 (JSON)
  ipAddress String?  @map("ip_address")                      // IP 地址
  userAgent String?  @map("user_agent")                     // User Agent
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@schema("aiops")
  @@map("audit_logs")
}
```

### 1.2 数据库迁移

**任务清单**:

- [ ] 生成 Prisma 迁移文件

  ```bash
  pnpm prisma migrate dev --name add_rbac_tables
  ```

- [ ] 生成 Prisma Client

  ```bash
  pnpm prisma generate
  ```

- [ ] 验证表结构
  ```bash
  pnpm prisma studio
  ```

### 1.3 初始化种子数据

**文件**: `docs/database_design/seed_data.sql`

```


## 🔧 第二阶段: 后端 API 开发

### 2.1 目录结构

```

server/
├── services/
│ └── auth/
│ ├── password.service.ts # 密码加密服务
│ ├── jwt.service.ts # JWT 令牌服务
│ ├── auth.service.ts # 认证服务
│ └── rbac.service.ts # RBAC 权限服务
├── repositories/
│ ├── users.repository.ts # 用户仓储
│ ├── roles.repository.ts # 角色仓储
│ ├── permissions.repository.ts # 权限仓储
│ └── refresh-tokens.repository.ts # 刷新令牌仓储
├── controllers/
│ ├── auth.controller.ts # 认证控制器
│ ├── users.controller.ts # 用户管理控制器
│ ├── roles.controller.ts # 角色管理控制器
│ └── permissions.controller.ts # 权限管理控制器
├── middleware/
│ ├── jwt-auth.middleware.ts # JWT 认证中间件
│ ├── rbac.middleware.ts # RBAC 权限中间件
│ └── validation.middleware.ts # 请求验证中间件
├── routes/
│ ├── auth.routes.ts # 认证路由
│ ├── users.routes.ts # 用户路由
│ ├── roles.routes.ts # 角色路由
│ └── permissions.routes.ts # 权限路由
└── types/
└── auth.types.ts # 认证相关类型定义

````

### 2.2 核心服务层

#### 2.2.1 密码加密服务

**文件**: `server/services/auth/password.service.ts`

```typescript
import bcrypt from 'bcrypt'

export class PasswordService {
  private readonly SALT_ROUNDS = 10

  /**
   * 哈希密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * 密码强度验证
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('密码长度至少为 8 个字符')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const passwordService = new PasswordService()
````

#### 2.2.2 JWT 服务

**文件**: `server/services/auth/jwt.service.ts`

```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: bigint;
  accountNo: string;
  email: string;
  type: "access" | "refresh";
}

export class JWTService {
  /**
   * 生成访问令牌
   */
  generateAccessToken(payload: Omit<JWTPayload, "type">): string {
    return jwt.sign({ ...payload, type: "access" }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * 生成刷新令牌
   */
  generateRefreshToken(payload: Omit<JWTPayload, "type">): string {
    return jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  /**
   * 验证令牌
   */
  verify(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  /**
   * 解码令牌 (不验证)
   */
  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * 计算访问令牌过期时间 (毫秒)
   */
  getAccessTokenExpiresIn(): number {
    const match = JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // 默认 15 分钟

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}

export const jwtService = new JWTService();
```

#### 2.2.3 认证服务

**文件**: `server/services/auth/auth.service.ts`

```typescript
import crypto from "crypto";
import { DatabaseService } from "../database.service";
import { passwordService } from "./password.service";
import { jwtService, JWTPayload } from "./jwt.service";
import { userRepository } from "../../repositories/users.repository";
import { refreshTokenRepository } from "../../repositories/refresh-tokens.repository";

export interface LoginInput {
  accountNo: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface RegisterInput {
  accountNo: string;
  email: string;
  password: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface AuthResponse {
  user: {
    id: bigint;
    accountNo: string;
    email: string;
    username?: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private prisma = DatabaseService.getInstance();
  private readonly refreshTokenTtlDays = 7;

  /**
   * 用户登录
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // 1. 查找用户
    const user = await userRepository.findByAccountNo(input.accountNo);
    if (!user) {
      throw new Error("用户不存在");
    }

    // 2. 检查用户状态
    if (user.status !== "active") {
      throw new Error("用户已被禁用");
    }

    // 3. 验证密码
    const isValid = await passwordService.verify(
      input.password,
      user.passwordHash
    );
    if (!isValid) {
      throw new Error("密码错误");
    }

    // 4. 生成令牌
    const tokenPayload: Omit<JWTPayload, "type"> = {
      userId: user.id,
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(tokenPayload);
    const refreshToken = jwtService.generateRefreshToken(tokenPayload);
    await this.persistRefreshToken(user.id, refreshToken, {
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceId: input.deviceId,
    });

    // 6. 更新最后登录时间
    await userRepository.updateLastLogin(user.id);

    // 7. 获取用户权限和角色
    const { permissions, roles } = await this.getUserPermissionsAndRoles(
      user.id
    );

    return {
      user: {
        id: user.id,
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 用户注册
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // 1. 验证密码强度
    const strengthCheck = passwordService.validateStrength(input.password);
    if (!strengthCheck.valid) {
      throw new Error(strengthCheck.errors.join(", "));
    }

    // 2. 检查账号是否已存在
    const existingUser = await userRepository.findByAccountNo(input.accountNo);
    if (existingUser) {
      throw new Error("账号已存在");
    }

    // 3. 检查邮箱是否已存在
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new Error("邮箱已被使用");
    }

    // 4. 哈希密码
    const passwordHash = await passwordService.hash(input.password);

    // 5. 创建用户
    const user = await this.prisma.user.create({
      data: {
        accountNo: input.accountNo,
        email: input.email,
        passwordHash,
        username: input.username,
        status: "active",
      },
    });

    // 6. 分配默认角色 (普通用户)
    const userRole = await this.prisma.role.findUnique({
      where: { code: "user" },
    });

    if (userRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: userRole.id,
        },
      });
    }

    // 7. 生成令牌
    const tokenPayload: Omit<JWTPayload, "type"> = {
      userId: user.id,
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(tokenPayload);
    const refreshToken = jwtService.generateRefreshToken(tokenPayload);
    await this.persistRefreshToken(user.id, refreshToken, {
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      deviceId: input.deviceId,
    });

    return {
      user: {
        id: user.id,
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 刷新令牌
   */
  async refresh(
    refreshToken: string
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken" | "expiresIn">> {
    // 1. 验证刷新令牌
    let payload: JWTPayload;
    try {
      payload = jwtService.verify(refreshToken);
    } catch {
      throw new Error("Invalid refresh token");
    }

    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // 2. 检查令牌是否存在
    const hashed = this.hashToken(refreshToken);
    const tokenRecord = await refreshTokenRepository.findByTokenHash(hashed);
    if (!tokenRecord) {
      throw new Error("Refresh token not found");
    }

    if (tokenRecord.revokedAt) {
      throw new Error("Refresh token has been revoked");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new Error("Refresh token has expired");
    }

    // 3. 检查用户是否存在
    const user = await userRepository.findById(payload.userId);
    if (!user || user.status !== "active") {
      throw new Error("User not found or disabled");
    }

    // 4. 生成新的访问令牌
    const newTokenPayload: Omit<JWTPayload, "type"> = {
      userId: user.id,
      accountNo: user.accountNo,
      email: user.email,
    };

    const accessToken = jwtService.generateAccessToken(newTokenPayload);
    const newRefreshToken = jwtService.generateRefreshToken(newTokenPayload);

    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + this.refreshTokenTtlDays);
    await refreshTokenRepository.rotateToken(
      tokenRecord.id,
      this.hashToken(newRefreshToken),
      newExpires
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: jwtService.getAccessTokenExpiresIn(),
    };
  }

  /**
   * 用户登出
   */
  async logout(refreshToken: string): Promise<void> {
    await refreshTokenRepository.revokeTokenByHash(
      this.hashToken(refreshToken)
    );
  }

  /**
   * 获取当前用户信息
   */
  async me(userId: bigint) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const { permissions, roles } = await this.getUserPermissionsAndRoles(
      user.id
    );

    return {
      user: {
        id: user.id,
        accountNo: user.accountNo,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      permissions,
      roles,
    };
  }

  /**
   * 获取用户权限和角色
   */
  private async getUserPermissionsAndRoles(userId: bigint) {
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      return { permissions: [], roles: [] };
    }

    const roles = userWithRoles.userRoles.map((ur) => ur.role.code);

    const permissions = userWithRoles.userRoles
      .flatMap((ur) => ur.role.rolePermissions)
      .map((rp) => rp.permission.code)
      .filter((code, index, self) => self.indexOf(code) === index); // 去重

    return { permissions, roles };
  }
}

export const authService = new AuthService();
```

新增的刷新令牌持久化逻辑:

```typescript
private hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

private async persistRefreshToken(
  userId: bigint,
  refreshToken: string,
  meta?: { ipAddress?: string; userAgent?: string; deviceId?: string }
) {
  const refreshTokenExpiresAt = new Date()
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + this.refreshTokenTtlDays)

  await refreshTokenRepository.createToken(
    userId,
    this.hashToken(refreshToken),
    refreshTokenExpiresAt,
    meta
  )
}
```

#### 2.2.4 RBAC 服务

**文件**: `server/services/auth/rbac.service.ts`

```typescript
import { DatabaseService } from "../database.service";

export class RBACService {
  private prisma = DatabaseService.getInstance();

  /**
   * 获取用户的所有权限代码
   */
  async getUserPermissions(userId: bigint): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
      select: { code: true },
    });

    return permissions.map((p) => p.code);
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId: bigint, permission: string): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        code: permission,
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有任一权限
   */
  async hasAnyPermission(
    userId: bigint,
    permissions: string[]
  ): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: {
        code: { in: permissions },
        rolePermissions: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
            },
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有所有权限
   */
  async hasAllPermissions(
    userId: bigint,
    permissions: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every((p) => userPermissions.includes(p));
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async hasRole(userId: bigint, roleCode: string): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        role: { code: roleCode },
      },
    });

    return count > 0;
  }

  /**
   * 检查用户是否拥有任一角色
   */
  async hasAnyRole(userId: bigint, roleCodes: string[]): Promise<boolean> {
    const count = await this.prisma.userRole.count({
      where: {
        userId,
        role: { code: { in: roleCodes } },
      },
    });

    return count > 0;
  }
}

export const rbacService = new RBACService();
```

#### 2.2.5 审计日志服务

**文件**: `server/services/audit-log.service.ts`

```typescript
import { DatabaseService } from "../database.service";

export type AuditAction =
  | "login"
  | "logout"
  | "refresh"
  | "user.create"
  | "user.update"
  | "role.assign"
  | "permission.assign";

class AuditLogService {
  private prisma = DatabaseService.getInstance();

  async record(params: {
    userId?: bigint;
    action: AuditAction;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource || "system",
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

export const auditLogService = new AuditLogService();
```

> 在 `auth.service.ts`, `users.controller.ts`, `roles.controller.ts` 等敏感操作完成后调用 `auditLogService.record(...)`，确保登录、登出、权限变更等事件可追溯。可额外提供 `/api/audit-logs` 只读接口供安全审计使用。

### 2.3 Repository 层

#### 2.3.1 用户仓储

**文件**: `server/repositories/users.repository.ts`

```typescript
import { BaseRepository } from "./base.repository";
import { Prisma } from "@prisma/client";

export class UserRepository extends BaseRepository<
  any,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  protected get modelName(): string {
    return "user";
  }

  /**
   * 通过账号查找用户
   */
  async findByAccountNo(accountNo: string) {
    return this.prisma.user.findUnique({
      where: { accountNo },
    });
  }

  /**
   * 通过邮箱查找用户
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * 更新最后登录时间
   */
  async updateLastLogin(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * 查询用户及其角色
   */
  async findWithRoles(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository(
  require("../services/database.service").DatabaseService.getInstance()
);
```

#### 2.3.2 刷新令牌仓储

**文件**: `server/repositories/refresh-tokens.repository.ts`

```typescript
import { BaseRepository } from "./base.repository";
import { Prisma } from "@prisma/client";

export class RefreshTokenRepository extends BaseRepository<
  any,
  Prisma.RefreshTokenCreateInput,
  Prisma.RefreshTokenUpdateInput,
  Prisma.RefreshTokenWhereInput,
  Prisma.RefreshTokenOrderByWithRelationInput
> {
  protected get modelName(): string {
    return "refreshToken";
  }

  /**
   * 创建刷新令牌
   */
  async createToken(
    userId: bigint,
    tokenHash: string,
    expiresAt: Date,
    meta?: { deviceId?: string; ipAddress?: string; userAgent?: string }
  ) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        deviceId: meta?.deviceId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    });
  }

  /**
   * 根据哈希查找令牌
   */
  async findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  /**
   * 标记令牌已轮换
   */
  async rotateToken(id: bigint, newHash: string, newExpiresAt: Date) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        tokenHash: newHash,
        rotatedAt: new Date(),
        expiresAt: newExpiresAt,
      },
    });
  }

  /**
   * 撤销令牌
   */
  async revokeTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * 删除过期令牌
   */
  async deleteExpiredTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository(
  require("../services/database.service").DatabaseService.getInstance()
);
```

### 2.4 中间件层

#### 2.4.1 JWT 认证中间件

**文件**: `server/middleware/jwt-auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/auth/jwt.service";

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: bigint;
        accountNo: string;
        email: string;
      };
    }
  }
}

/**
 * JWT 认证中间件
 */
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. 从 Authorization Header 提取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.substring(7);

    // 2. 验证 token
    const payload = jwtService.verify(token);

    // 3. 检查 token 类型
    if (payload.type !== "access") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token type",
      });
    }

    // 4. 将用户信息注入请求
    req.user = {
      id: payload.userId,
      accountNo: payload.accountNo,
      email: payload.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

/**
 * 可选的 JWT 认证中间件 (不强制要求)
 */
export function optionalJwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = jwtService.verify(token);

      if (payload.type === "access") {
        req.user = {
          id: payload.userId,
          accountNo: payload.accountNo,
          email: payload.email,
        };
      }
    }

    next();
  } catch {
    next();
  }
}
```

#### 2.4.2 RBAC 权限中间件

**文件**: `server/middleware/rbac.middleware.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { rbacService } from "../services/auth/rbac.service";

/**
 * 要求指定权限 (AND)
 */
export function requirePermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "未登录" });
    }

    try {
      const hasPermission = await rbacService.hasAllPermissions(
        req.user.id,
        permissions
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `需要权限: ${permissions.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: "权限检查失败" });
    }
  };
}

/**
 * 要求任一权限 (OR)
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "未登录" });
    }

    try {
      const hasPermission = await rbacService.hasAnyPermission(
        req.user.id,
        permissions
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: "Forbidden",
          message: `需要以下任一权限: ${permissions.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: "权限检查失败" });
    }
  };
}

/**
 * 要求指定角色
 */
export function requireRoles(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "未登录" });
    }

    try {
      const hasAllRoles = await Promise.all(
        roles.map((role) => rbacService.hasRole(req.user!.id, role))
      );

      if (!hasAllRoles.every(Boolean)) {
        return res.status(403).json({
          error: "Forbidden",
          message: `需要角色: ${roles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: "角色检查失败" });
    }
  };
}

/**
 * 要求任一角色
 */
export function requireAnyRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "未登录" });
    }

    try {
      const hasAnyRole = await rbacService.hasAnyRole(req.user!.id, roles);

      if (!hasAnyRole) {
        return res.status(403).json({
          error: "Forbidden",
          message: `需要以下任一角色: ${roles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: "角色检查失败" });
    }
  };
}
```

### 2.5 控制器层

#### 2.5.1 认证控制器

**文件**: `server/controllers/auth.controller.ts`

```typescript
import { Request, Response } from "express";
import { authService } from "../services/auth/auth.service";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
};

export async function register(req: Request, res: Response) {
  try {
    const { accountNo, email, password, username } = req.body;

    const result = await authService.register({
      accountNo,
      email,
      password,
      username,
    });

    res
      .cookie("refreshToken", result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(201)
      .json({
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { accountNo, password } = req.body;

    const result = await authService.login({
      accountNo,
      password,
    });

    res
      .cookie("refreshToken", result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res
      .clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS)
      .json({ message: "登出成功" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;

    const result = await authService.refresh(refreshToken);

    res
      .cookie("refreshToken", result.refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await authService.me(req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
```

#### 2.5.2 用户管理控制器

**文件**: `server/controllers/users.controller.ts`

```typescript
import { Request, Response } from "express";
import { DatabaseService } from "../services/database.service";

const prisma = DatabaseService.getInstance();

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = "1", limit = "10", search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search
      ? {
          OR: [
            { accountNo: { contains: search as string } },
            { email: { contains: search as string } },
            { username: { contains: search as string } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          accountNo: true,
          email: true,
          username: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: {
        id: true,
        accountNo: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username, avatar, status } = req.body;

    const user = await prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        username,
        avatar,
        status,
      },
      select: {
        id: true,
        accountNo: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "用户删除成功" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function assignRoles(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    // 删除现有角色
    await prisma.userRole.deleteMany({
      where: { userId: BigInt(id) },
    });

    // 分配新角色
    await prisma.userRole.createMany({
      data: roleIds.map((roleId: bigint) => ({
        userId: BigInt(id),
        roleId,
      })),
    });

    res.json({ message: "角色分配成功" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2.5.3 角色 & 权限管理控制器

**文件**: `server/controllers/roles.controller.ts`

```typescript
import { Request, Response } from "express";
import { DatabaseService } from "../services/database.service";

const prisma = DatabaseService.getInstance();

export async function listRoles(req: Request, res: Response) {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { sort: "asc" },
  });
  res.json(roles);
}

export async function createRole(req: Request, res: Response) {
  const { name, code, description, permissionIds } = req.body;

  const role = await prisma.role.create({
    data: {
      name,
      code,
      description,
      rolePermissions: {
        create: permissionIds?.map((permissionId: bigint) => ({
          permissionId,
        })),
      },
    },
  });

  res.status(201).json(role);
}

export async function updateRole(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, status, permissionIds } = req.body;

  const role = await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id: BigInt(id) },
      data: { name, description, status },
    });

    await tx.rolePermission.deleteMany({ where: { roleId: BigInt(id) } });
    if (permissionIds?.length) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId: bigint) => ({
          roleId: BigInt(id),
          permissionId,
        })),
      });
    }

    return tx.role.findUnique({
      where: { id: BigInt(id) },
      include: { rolePermissions: { include: { permission: true } } },
    });
  });

  res.json(role);
}
```

**文件**: `server/controllers/permissions.controller.ts`

```typescript
import { Request, Response } from "express";
import { DatabaseService } from "../services/database.service";

const prisma = DatabaseService.getInstance();

export async function listPermissions(req: Request, res: Response) {
  const { module } = req.query;
  const permissions = await prisma.permission.findMany({
    where: module ? { module: module as string } : {},
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  res.json(permissions);
}

export async function syncPermissions(req: Request, res: Response) {
  // 允许通过脚本同步前端声明到数据库
  const { permissions } = req.body;

  await prisma.$transaction(async (tx) => {
    for (const perm of permissions) {
      await tx.permission.upsert({
        where: { code: perm.code },
        update: perm,
        create: perm,
      });
    }
  });

  res.json({ message: "权限同步完成" });
}
```

对应路由 `server/routes/roles.routes.ts`、`server/routes/permissions.routes.ts` 需要结合 `requirePermissions` 中间件加上 `role:*` / `permission:*` 权限保护。

### 2.6 路由层

#### 2.6.1 认证路由

**文件**: `server/routes/auth.routes.ts`

```typescript
import express from "express";
import * as authController from "../controllers/auth.controller";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post("/register", authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post("/login", authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新令牌
 * @access  Public
 */
router.post("/refresh", authController.refresh);

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get("/me", authController.me);

export default router;
```

#### 2.6.2 用户路由

**文件**: `server/routes/users.routes.ts`

```typescript
import express from "express";
import { jwtAuthMiddleware } from "../middleware/jwt-auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import * as usersController from "../controllers/users.controller";

const router = express.Router();

// 所有路由需要认证
router.use(jwtAuthMiddleware);

/**
 * @route   GET /api/users
 * @desc    获取用户列表
 * @access  Private + user:view
 */
router.get("/", requirePermissions("user:view"), usersController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    获取用户详情
 * @access  Private + user:view
 */
router.get(
  "/:id",
  requirePermissions("user:view"),
  usersController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Private + user:update
 */
router.put(
  "/:id",
  requirePermissions("user:update"),
  usersController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  Private + user:delete
 */
router.delete(
  "/:id",
  requirePermissions("user:delete"),
  usersController.deleteUser
);

/**
 * @route   PUT /api/users/:id/roles
 * @desc    分配角色
 * @access  Private + user:assign-roles
 */
router.put(
  "/:id/roles",
  requirePermissions("user:assign-roles"),
  usersController.assignRoles
);

export default router;
```

### 2.7 服务器集成

**文件**: `server/index.ts`

```typescript
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import { openCodeService } from "./services/opencode.service.js";
import { DatabaseService } from "./services/database.service.js";
import { metricsEndpoint } from "./utils/metrics.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sessions", sessionsRoutes);

// 健康检查
app.get("/health", async (req, res) => {
  try {
    const db = DatabaseService.getInstance();
    await db.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      database: "healthy",
    });
  } catch (error) {
    res.json({
      status: "ok",
      database: "unhealthy",
    });
  }
});

// 指标端点
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", "text/plain");
  res.end(await metricsEndpoint());
});

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    await DatabaseService.connect();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log("Shutting down...");
      await openCodeService.cleanupAll();
      await DatabaseService.disconnect();
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
```

---

## 🎨 第三阶段: 前端集成

### 3.1 前端目录结构

```
src/
├── lib/
│   ├── api-client.ts              # Axios 客户端配置
│   └── ability.ts                 # CASL Ability 定义
├── context/
│   └── ability-context.tsx        # Ability Context
├── hooks/
│   ├── use-auth.ts                # 认证 Hook
│   ├── use-permissions.ts         # 权限 Hook
│   └── use-roles.ts               # 角色 Hook
├── components/
│   └── auth/
│       ├── ability-provider.tsx   # Ability Provider
│       ├── can.tsx                # 权限控制组件
│       ├── role-guard.tsx         # 角色控制组件
│       └── protected-route.tsx    # 路由守卫组件
├── features/
│   ├── auth/
│   │   ├── sign-in/
│   │   │   ├── index.tsx
│   │   │   └── components/
│   │   │       └── user-auth-form.tsx
│   │   └── sign-up/
│   │       ├── index.tsx
│   │       └── components/
│   │           └── user-register-form.tsx
│   └── users/
│       ├── index.tsx
│       └── components/
│           ├── user-table.tsx
│           ├── user-form-dialog.tsx
│           └── assign-roles-dialog.tsx
├── routes/
│   ├── __root.tsx                 # 根路由 (认证守卫)
│   ├── _authenticated/
│   │   ├── route.tsx              # 认证布局
│   │   ├── settings/
│   │   │   ├── roles/
│   │   │   │   └── index.tsx
│   │   │   └── permissions/
│   │   │       └── index.tsx
│   │   └── users/
│   │       └── index.tsx
│   └── (auth)/
│       ├── sign-in.tsx
│       └── sign-up.tsx
└── stores/
    └── auth-store.ts              # 认证 Store (更新)
```

### 3.2 核心配置

#### 3.2.1 API 客户端配置

**文件**: `src/lib/api-client.ts`

```typescript
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true, // 携带 httpOnly Refresh Token
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器: 添加 Authorization Header
apiClient.interceptors.request.use(
  (config) => {
    const { auth } = useAuthStore.getState();
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器: 处理 401 和 Token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新 Token (Refresh Token 存在 httpOnly Cookie 中)
        const response = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const { accessToken, expiresIn } = response.data;

        useAuthStore.getState().auth.setAccessToken(accessToken, expiresIn);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().auth.reset();
        window.location.href = "/sign-in";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 3.2.2 CASL Ability 定义

**文件**: `src/lib/ability.ts`

```typescript
import { Ability, AbilityBuilder } from "@casl/ability";

export type Actions =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "install"
  | "uninstall"
  | "assign-roles"
  | "assign-permissions";
export type Subjects =
  | "User"
  | "Role"
  | "Session"
  | "Skill"
  | "Mcp"
  | "Agent"
  | "all";

export type AppAbility = Ability<[Actions, Subjects]>;

/**
 * 根据权限代码列表创建 Ability
 */
export function defineAbilityFor(permissions: string[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>();

  permissions.forEach((permission) => {
    const [resource, action] = permission.split(":");

    // 权限代码映射到 CASL action
    const actionMap: Record<string, Actions> = {
      view: "read",
      create: "create",
      update: "update",
      delete: "delete",
      install: "install",
      uninstall: "uninstall",
      "assign-roles": "assign-roles",
      "assign-permissions": "assign-permissions",
    };

    const caslAction = actionMap[action] || action;

    can(caslAction, resource as any);
  });

  return build();
}

/**
 * 解析权限代码
 */
export function parsePermission(code: string): {
  resource: string;
  action: string;
} {
  const [resource, action] = code.split(":");
  return { resource, action };
}
```

#### 3.2.3 Ability Context

**文件**: `src/context/ability-context.tsx`

```typescript
"use client";

import { createContext, useContext } from "react";
import { AppAbility } from "@/lib/ability";

export const AbilityContext = createContext<AppAbility | null>(null);

export function useAbility() {
  const ability = useContext(AbilityContext);

  if (!ability) {
    throw new Error("useAbility must be used within AbilityProvider");
  }

  return ability;
}
```

#### 3.2.4 Ability Provider 组件

**文件**: `src/components/auth/ability-provider.tsx`

```tsx
"use client";

import { ReactNode } from "react";
import { AbilityContext } from "@/context/ability-context";
import { defineAbilityFor } from "@/lib/ability";
import { useAuthStore } from "@/stores/auth-store";

interface AbilityProviderProps {
  children: ReactNode;
}

export function AbilityProvider({ children }: AbilityProviderProps) {
  const { auth } = useAuthStore();

  const ability = defineAbilityFor(auth.user?.permissions || []);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
```

### 3.3 权限组件

#### 3.3.1 Can 组件

**文件**: `src/components/auth/can.tsx`

```tsx
"use client";

import { ReactNode } from "react";
import { Can as CASLCAN } from "@casl/react";
import { useAbility } from "@/context/ability-context";

interface CanProps {
  I: string;
  a: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ I, a, children, fallback = null }: CanProps) {
  const ability = useAbility();

  return (
    <CASLCAN I={I as any} a={a as any} ability={ability} fallback={fallback}>
      {children}
    </CASLCAN>
  );
}
```

#### 3.3.2 PermissionGuard 组件

**文件**: `src/components/auth/permission-guard.tsx`

```tsx
"use client";

import { ReactNode } from "react";
import { useAbility } from "@/context/ability-context";
import { parsePermission } from "@/lib/ability";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const ability = useAbility();
  const { resource, action } = parsePermission(permission);

  const can = ability.can(action as any, resource as any);

  if (!can) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 使用示例:
// <PermissionGuard permission="user:create">
//   <Button>创建用户</Button>
// </PermissionGuard>
```

#### 3.3.3 RoleGuard 组件

**文件**: `src/components/auth/role-guard.tsx`

```tsx
"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface RoleGuardProps {
  roles: string[];
  requireAll?: boolean; // true: 需要所有角色, false: 需要任一角色
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  roles,
  requireAll = false,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { auth } = useAuthStore();
  const userRoles = auth.user?.roles || [];

  const hasRole = requireAll
    ? roles.every((role) => userRoles.includes(role))
    : roles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 使用示例:
// <RoleGuard roles={['admin']}>
//   <AdminPanel />
// </RoleGuard>
```

### 3.4 Hooks

#### 3.4.1 useAuth Hook

**文件**: `src/hooks/use-auth.ts`

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import apiClient from "@/lib/api-client";

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const { auth } = authStore;
  const { setUser, setAccessToken, reset } = auth;

  // 登录
  const loginMutation = useMutation({
    mutationFn: async (data: { accountNo: string; password: string }) => {
      const response = await apiClient.post("/api/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser({
        id: String(data.user.id),
        accountNo: data.user.accountNo,
        email: data.user.email,
        username: data.user.username,
        avatar: data.user.avatar,
        permissions: [], // 稍后通过 me 接口获取
        roles: [],
        exp: Date.now() + data.expiresIn,
      });
      setAccessToken(data.accessToken, data.expiresIn);

      toast.success("登录成功");

      // 跳转到首页或之前的页面
      navigate({ to: "/" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "登录失败");
    },
  });

  // 注册
  const registerMutation = useMutation({
    mutationFn: async (data: {
      accountNo: string;
      email: string;
      password: string;
      username?: string;
    }) => {
      const response = await apiClient.post("/api/auth/register", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("注册成功,请登录");
      navigate({ to: "/sign-in" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "注册失败");
    },
  });

  // 登出
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/auth/logout");
    },
    onSuccess: () => {
      reset();
      queryClient.clear();
      toast.success("登出成功");
      navigate({ to: "/sign-in" });
    },
  });

  // 获取当前用户信息
  const { data: userMe, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await apiClient.get("/api/auth/me");
      return response.data;
    },
    enabled: !!auth.accessToken,
    onSuccess: (data) => {
      setUser({
        id: String(data.user.id),
        accountNo: data.user.accountNo,
        email: data.user.email,
        username: data.user.username,
        avatar: data.user.avatar,
        permissions: data.permissions,
        roles: data.roles,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 小时
      });
    },
  });

  return {
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: !!auth.accessToken,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
  };
}
```

#### 3.4.2 usePermissions Hook

**文件**: `src/hooks/use-permissions.ts`

```typescript
"use client";

import { useAbility } from "@/context/ability-context";
import { useAuthStore } from "@/stores/auth-store";

export function usePermissions() {
  const ability = useAbility();
  const { auth } = useAuthStore();

  const permissions = auth.user?.permissions || [];

  return {
    permissions,

    // 检查单个权限
    hasPermission: (permission: string) => {
      const [resource, action] = permission.split(":");
      return ability.can(action as any, resource as any);
    },

    // 检查是否拥有所有权限
    hasAllPermissions: (perms: string[]) => {
      return perms.every((permission) => {
        const [resource, action] = permission.split(":");
        return ability.can(action as any, resource as any);
      });
    },

    // 检查是否拥有任一权限
    hasAnyPermission: (perms: string[]) => {
      return perms.some((permission) => {
        const [resource, action] = permission.split(":");
        return ability.can(action as any, resource as any);
      });
    },
  };
}
```

### 3.5 Store 更新

**文件**: `src/stores/auth-store.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  accountNo: string;
  email: string;
  username?: string;
  avatar?: string;
  permissions: string[];
  roles: string[];
  exp: number;
}

interface AuthState {
  auth: {
    user: AuthUser | null;
    accessToken: string;
    accessTokenExpiresAt: number;
    setUser: (user: AuthUser | null) => void;
    setAccessToken: (token: string, expiresIn: number) => void;
    reset: () => void;
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: {
        user: null,
        accessToken: "",
        accessTokenExpiresAt: 0,
        setUser: (user) =>
          set((state) => ({ ...state, auth: { ...state.auth, user } })),
        setAccessToken: (token, expiresIn) =>
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              accessToken: token,
              accessTokenExpiresAt: Date.now() + expiresIn,
            },
          })),
        reset: () =>
          set((state) => ({
            ...state,
            auth: { user: null, accessToken: "", accessTokenExpiresAt: 0 },
          })),
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        auth: {
          user: state.auth.user,
        },
      }),
    }
  )
);
```

### 3.6 登录页面更新

**文件**: `src/features/auth/sign-in/components/user-auth-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

const formSchema = z.object({
  accountNo: z.string().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码").min(7, "密码长度至少为7个字符"),
});

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string;
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountNo: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      await login(data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="accountNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>账号</FormLabel>
              <FormControl>
                <Input placeholder="请输入账号" {...field} />
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
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
          登录
        </Button>
      </form>
    </Form>
  );
}
```

### 3.7 路由守卫

**文件**: `src/routes/__root.tsx`

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState();

    // 检查是否登录
    if (!auth.accessToken) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }

    // 检查 token 是否过期
    if (auth.user && auth.user.exp < Date.now()) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
});
```

---

## 📱 第四阶段: 管理功能页面

### 4.1 用户管理页面

#### 4.1.1 用户列表页

**文件**: `src/routes/_authenticated/users/index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { UserTable } from "../features/users/components/user-table";

export const Route = createFileRoute("/_authenticated/users/")({
  component: UsersPage,
});

function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get("/api/users");
      return response.data;
    },
  });

  if (isLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <PermissionGuard permission="user:create">
          <Button>创建用户</Button>
        </PermissionGuard>
      </div>

      <UserTable data={data?.data || []} />
    </div>
  );
}
```

#### 4.1.2 用户表格组件

**文件**: `src/features/users/components/user-table.tsx`

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface User {
  id: bigint;
  accountNo: string;
  email: string;
  username?: string;
  status: string;
  userRoles: Array<{
    role: {
      name: string;
      code: string;
    };
  }>;
}

const columns: ColumnDef<User>[] = [
  { accessorKey: "accountNo", header: "账号" },
  { accessorKey: "email", header: "邮箱" },
  { accessorKey: "username", header: "用户名" },
  { accessorKey: "status", header: "状态" },
  {
    accessorKey: "userRoles",
    header: "角色",
    cell: ({ row }) =>
      row.original.userRoles.map((ur) => ur.role.name).join(", "),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <PermissionGuard permission="user:update">
          <Button variant="ghost" size="sm">
            编辑
          </Button>
        </PermissionGuard>
        <PermissionGuard permission="user:delete">
          <Button variant="ghost" size="sm">
            删除
          </Button>
        </PermissionGuard>
      </div>
    ),
  },
];

interface UserTableProps {
  data: User[];
}

export function UserTable({ data }: UserTableProps) {
  return <DataTable columns={columns} data={data} />;
}
```

### 4.2 角色管理页面

**文件**: `src/routes/_authenticated/settings/roles/index.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings/roles/")({
  component: RolesPage,
});

function RolesPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">角色管理</h1>
        <PermissionGuard permission="role:create">
          <Button>创建角色</Button>
        </PermissionGuard>
      </div>

      {/* 角色列表表格 */}
      <div>角色列表...</div>
    </div>
  );
}
```

#### 4.2.1 角色表格 & 编辑弹窗

**文件**: `src/features/roles/components/role-table.tsx`

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { RoleFormDialog } from "./role-form-dialog";
import { Button } from "@/components/ui/button";

const columns: ColumnDef<Role>[] = [
  { accessorKey: "name", header: "角色名称" },
  { accessorKey: "code", header: "代码" },
  { accessorKey: "status", header: "状态" },
  {
    accessorKey: "rolePermissions",
    header: "权限数",
    cell: ({ row }) => row.original.rolePermissions.length,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <PermissionGuard permission="role:update">
          <RoleFormDialog role={row.original} />
        </PermissionGuard>
        <PermissionGuard permission="role:delete">
          <Button variant="ghost" size="sm">
            删除
          </Button>
        </PermissionGuard>
      </div>
    ),
  },
];
```

#### 4.2.2 角色表单

```tsx
export function RoleFormDialog({ role }: { role?: Role }) {
  const form = useForm({
    defaultValues: {
      name: role?.name ?? "",
      code: role?.code ?? "",
      permissionIds: role?.rolePermissions.map((rp) => rp.permissionId) ?? [],
    },
  });

  const mutation = useMutation({
    mutationFn: (payload) =>
      role
        ? apiClient.put(`/api/roles/${role.id}`, payload)
        : apiClient.post("/api/roles", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={role ? "ghost" : "default"} size="sm">
          {role ? "编辑" : "创建角色"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {/* 表单字段 */}
        <PermissionPicker
          value={form.watch("permissionIds")}
          onChange={(value) => form.setValue("permissionIds", value)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### 4.3 权限管理页面

提供 `module` 维度过滤、批量同步按钮，确保产品可在 UI 中配置权限。

```tsx
<PermissionGuard permission='permission:sync'>
  <Button onClick={handleSync}>同步权限</Button>
</PermissionGuard>
<DataTable columns={permissionColumns} data={data?.permissions ?? []} />
```

同步按钮扫描 `src/config/permissions.ts` 的权限清单，通过 `/api/permissions/sync` 一次性落库，杜绝遗漏。

---

## 🔐 第五阶段: 现有功能集成 RBAC

### 5.1 会话管理集成

**文件**: `src/routes/_authenticated/ai-chat/index.tsx`

```tsx
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";

export function AiChatPage() {
  return (
    <div>
      {/* 创建会话按钮 */}
      <PermissionGuard permission="session:create">
        <Button>新建会话</Button>
      </PermissionGuard>

      {/* 删除会话按钮 */}
      <PermissionGuard permission="session:delete">
        <Button variant="destructive">删除会话</Button>
      </PermissionGuard>
    </div>
  );
}
```

### 5.2 技能管理集成

```tsx
// 技能列表页面
<PermissionGuard permission='skill:create'>
  <Button>创建技能</Button>
</PermissionGuard>

<PermissionGuard permission='skill:install'>
  <Button>装载技能</Button>
</PermissionGuard>

<PermissionGuard permission='skill:uninstall'>
  <Button>卸载技能</Button>
</PermissionGuard>
```

---

## 🛡️ 第六阶段: 安全增强

### 6.1 环境变量配置

**文件**: `.env`

```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# 认证开关
REQUIRE_AUTH=true
```

### 6.2 密码策略增强

```typescript
// server/services/auth/password.service.ts
validateStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) errors.push('密码长度至少为 8 个字符')
  if (!/[A-Z]/.test(password)) errors.push('密码必须包含至少一个大写字母')
  if (!/[a-z]/.test(password)) errors.push('密码必须包含至少一个小写字母')
  if (!/[0-9]/.test(password)) errors.push('密码必须包含至少一个数字')
  if (!/[!@#$%^&*]/.test(password)) errors.push('密码必须包含至少一个特殊字符')

  return { valid: errors.length === 0, errors }
}
```

### 6.3 账户锁定机制

```typescript
// 登录失败计数器 (可使用 Redis 实现)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 分钟
```

### 6.4 密码找回流程

1. `forgot-password` 接口接收邮箱/账号 -> 生成一次性 `reset_token`（存储 SHA256 哈希、10 分钟过期）。
2. 发送邮件 (Resend/Aws SES) 带有重置链接 `https://app/reset?token=...`。
3. 前端重置页面调用 `reset-password` 接口，提交新密码 + token。
4. 服务端验证 token、校验密码强度后落库，同时记录 `auditLogService.record({ action: 'user.update', resourceId: userId })`。

相应的 `PasswordResetToken` 表字段: `tokenHash`, `userId`, `expiresAt`, `consumedAt`, `ipAddress`.

### 6.5 多因素认证 (MFA)

- 采用 TOTP (Google Authenticator) + Recovery Codes。
- `user_mfa` 表存储 `secret`, `enabledAt`, `recoveryCodes (Json)`。
- 登录流程: 第一步校验密码 -> 若开启 MFA，返回 `mfa_required` 状态，前端展示验证码输入框并调用 `/api/auth/mfa/verify`。
- 在 `AuditLog` 中分别记录 `login` 和 `login.mfa` 事件，便于溯源。

### 6.6 会话/设备管理

- `RefreshToken` 表新增 `deviceId` / `userAgent` / `ipAddress` 后，可实现“设备列表”页面：`GET /api/sessions/devices` 返回所有活跃刷新令牌。
- 用户可在前端“安全设置”中“踢出”设备 -> 调用 `DELETE /api/sessions/devices/:tokenId`，服务端将 `revokedAt` 置位。
- 周期任务 (每天) 运行 `refreshTokenRepository.deleteExpiredTokens()` 并写入审计日志。

### 6.7 SSO / 企业身份整合（可选）

- 通过 `passport` 集成企业 IdP (OIDC / SAML)。
- 成功回调后，根据 IdP 返回的 email 自动创建用户并绑定默认角色，仍走本方案的 RBAC。
- 建议为外部身份的 Access Token 添加 `source` 字段，写入 `AuditLog` 以区别本地登录与企业登录。

---

## 🧪 第七阶段: 测试和文档

### 7.1 单元测试

```typescript
// server/services/auth/__tests__/password.service.test.ts
import { passwordService } from "../password.service";

describe("PasswordService", () => {
  it("should hash password", async () => {
    const hash = await passwordService.hash("password123");
    expect(hash).not.toBe("password123");
  });

  it("should verify password", async () => {
    const hash = await passwordService.hash("password123");
    const isValid = await passwordService.verify("password123", hash);
    expect(isValid).toBe(true);
  });

  it("should validate password strength", () => {
    const result = passwordService.validateStrength("weak");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

> 除上述示例外，还需针对 `auth.service`, `rbac.service`, `middleware` 编写单测，覆盖权限拒绝、Refresh Token 重放、账户锁定等关键路径。

### 7.2 集成测试

- 使用 `supertest` + `vitest` 跑通登录、刷新、登出、用户 CRUD。
- 案例示例:

```typescript
it("should rotate refresh token on refresh", async () => {
  const login = await request(app)
    .post("/api/auth/login")
    .send({ accountNo: "admin", password: "admin123" });
  const refreshCookie = login
    .get("Set-Cookie")
    .find((cookie) => cookie.startsWith("refreshToken"));

  const refresh = await request(app)
    .post("/api/auth/refresh")
    .set("Cookie", refreshCookie!);
  expect(refresh.body.accessToken).toBeDefined();
  expect(
    refresh
      .get("Set-Cookie")
      .some((cookie) => cookie.startsWith("refreshToken"))
  ).toBe(true);
});
```

### 7.3 前端测试

- `@testing-library/react` 测试 `PermissionGuard` / `RoleGuard` 的渲染逻辑。
- `Cypress/Playwright` 编写 e2e：登录 -> 访问受限页面 -> 验证按钮显示/隐藏 -> 登出。

### 7.4 API 文档

更新 [`docs/openapi.json`](../openapi.json)，添加认证、角色、权限、设备管理 API 文档。

### 7.5 使用文档

创建 [`docs/rbac-implementation.md`](rbac-implementation.md)，包含:

- 数据库 ER 图
- 权限设计说明
- 典型调用流程 (登录 / 刷新 / 分配角色)
- 常见问题 & 故障排查

---

## 📅 推荐实现顺序

### 第 1 周: 数据库 + 后端基础

- ✅ Prisma Schema 设计
- ✅ 数据库迁移
- ✅ 种子数据初始化
- ✅ Repository 层实现
- ✅ 密码加密服务
- ✅ JWT 服务

### 第 2 周: 后端 API

- ✅ 认证服务
- ✅ RBAC 服务
- ✅ 认证中间件
- ✅ 权限中间件
- ✅ 认证控制器和路由
- ✅ 用户管理 API

### 第 3 周: 前端集成

- ✅ API 客户端配置
- ✅ CASL 集成
- ✅ Auth Store 更新
- ✅ 权限组件
- ✅ 登录页面更新
- ✅ 路由守卫

### 第 4 周: 管理功能

- ✅ 用户管理页面
- ✅ 角色管理页面
- ✅ 现有功能集成 RBAC

### 第 5 周: 安全 + 验证

- [ ] 安全增强 (MFA、密码找回、锁定、设备管理、审计日志)
- [ ] 单元 / 集成 / E2E / 安全扫描
- [ ] API 文档 + Runbook (OpenAPI、使用文档、操作手册)

---

## ✅ 开发 TODO 看板

| 序号 | 任务                                                                        | Owner              | 优先级 | 截止  | 备注                                        |
| ---- | --------------------------------------------------------------------------- | ------------------ | ------ | ----- | ------------------------------------------- |
| 1    | 完成 Prisma Schema + 迁移 + 种子脚本并联调数据库                            | Backend            | P0     | Week1 | 包含刷新令牌新字段、密码重置表              |
| 2    | 实现 AuthService (哈希 Refresh Token、轮换、锁定、审计) 与相应控制器/Cookie | Backend            | P0     | Week2 | 需要打通 `auditLogService`、`cookie-parser` |
| 3    | 落地 RBAC 服务 + roles/permissions controller + routes + 中间件接入         | Backend            | P0     | Week2 | 包括权限同步接口                            |
| 4    | 前端 Auth Store / API Client / Ability Provider / Hooks                     | Frontend           | P0     | Week3 | Token 仅驻内存，Refresh Token 走 Cookie     |
| 5    | 用户/角色/权限管理 UI + 设备列表 + 权限选择器组件                           | Frontend           | P1     | Week4 | 依赖后端接口 ready                          |
| 6    | 安全能力: 密码找回、MFA、设备踢出、审计日志写入与查看                       | Backend + Frontend | P1     | Week5 | 包含邮件模板与 TOTP enrollment              |
| 7    | 测试与质量: 单元/集成/E2E、性能 & 安全扫描、监控告警配置                    | QA/DevOps          | P0     | Week5 | 产出测试报告与覆盖率                        |
| 8    | 文档: OpenAPI、RBAC 实施指南、Runbook、FAQ                                  | Tech Writer        | P1     | Week5 | 与产品/运营共审                             |

> 可以将该表同步到 `docs/todo.md` 或项目管理工具 (Linear/Jira) 做实时追踪。

## 🎯 总结

本方案提供了完整的 RBAC + 用户认证实现路线图，核心特点:

1. **轻量级**: 无需引入复杂的第三方库
2. **高性能**: 直接基于 Prisma 查询
3. **易维护**: 代码清晰，易于理解和扩展
4. **类型安全**: TypeScript 全链路支持
5. **灵活**: 可根据需求快速调整

预计总开发时间: **4-5 周** (单人开发)

---

**文档生成时间**: 2026-01-28
**项目**: SkllsFlow AIOps 智能平台
**版本**: 2.0.0
