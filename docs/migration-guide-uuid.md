# 用户 ID 迁移指南：从 BigInt 到 UUID

## 概述

本文档详细说明了将用户 ID 从自增 BigInt 迁移到 UUID 的完整步骤。

**迁移策略**：方案 B（双 ID 设计）
- 保留 `id` (BigInt) 作为内部主键
- 添加 `userId` (UUID) 作为业务 ID 和对外标识符
- 保留 `accountNo` (String) 作为登录账号
- 所有关联表改用 `userId` (UUID) 进行关联

---

## 一、数据库层修改（手动操作）

### 1.1 User 表修改

```sql
-- 1. 添加 user_id 列（UUID）
ALTER TABLE aiops.users
ADD COLUMN user_id UUID UNIQUE DEFAULT gen_random_uuid();

-- 2. 为现有数据生成 UUID
UPDATE aiops.users
SET user_id = gen_random_uuid()
WHERE user_id IS NULL;

-- 3. 设置为 NOT NULL
ALTER TABLE aiops.users
ALTER COLUMN user_id SET NOT NULL;

-- 4. 添加索引
CREATE INDEX idx_users_user_id ON aiops.users (user_id);

-- 5. 添加注释
COMMENT ON COLUMN aiops.users.user_id IS '业务 ID（对外 API，全局唯一，不可变）';
```

### 1.2 关联表修改

#### UserRole 表

```sql
-- 1. 添加新的 user_id 列（UUID）
ALTER TABLE aiops.user_roles
ADD COLUMN user_id_uuid UUID;

-- 2. 迁移数据（通过 BIGINT user_id 查找对应的 UUID）
UPDATE aiops.user_roles ur
SET user_id_uuid = u.user_id
FROM aiops.users u
WHERE ur.user_id = u.id;

-- 3. 验证数据完整性
SELECT COUNT(*) FROM aiops.user_roles WHERE user_id_uuid IS NULL;
-- 应该返回 0

-- 4. 删除旧的外键约束
ALTER TABLE aiops.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 5. 删除旧的 user_id 列
ALTER TABLE aiops.user_roles
DROP COLUMN user_id;

-- 6. 重命名新列
ALTER TABLE aiops.user_roles
RENAME COLUMN user_id_uuid TO user_id;

-- 7. 设置为 NOT NULL
ALTER TABLE aiops.user_roles
ALTER COLUMN user_id SET NOT NULL;

-- 8. 添加新的外键约束
ALTER TABLE aiops.user_roles
ADD CONSTRAINT fk_user_roles_user_id
FOREIGN KEY (user_id) REFERENCES aiops.users(user_id) ON DELETE CASCADE;

-- 9. 重建索引
DROP INDEX IF EXISTS idx_user_roles_user_id;
CREATE INDEX idx_user_roles_user_id ON aiops.user_roles (user_id);
```

#### RefreshToken 表

```sql
-- 1. 添加新的 user_id 列（UUID）
ALTER TABLE aiops.refresh_tokens
ADD COLUMN user_id_uuid UUID;

-- 2. 迁移数据
UPDATE aiops.refresh_tokens rt
SET user_id_uuid = u.user_id
FROM aiops.users u
WHERE rt.user_id = u.id;

-- 3. 验证数据完整性
SELECT COUNT(*) FROM aiops.refresh_tokens WHERE user_id_uuid IS NULL;

-- 4. 删除旧的外键约束
ALTER TABLE aiops.refresh_tokens
DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

-- 5. 删除旧的 user_id 列
ALTER TABLE aiops.refresh_tokens
DROP COLUMN user_id;

-- 6. 重命名新列
ALTER TABLE aiops.refresh_tokens
RENAME COLUMN user_id_uuid TO user_id;

-- 7. 设置为 NOT NULL
ALTER TABLE aiops.refresh_tokens
ALTER COLUMN user_id SET NOT NULL;

-- 8. 添加新的外键约束
ALTER TABLE aiops.refresh_tokens
ADD CONSTRAINT fk_refresh_tokens_user_id
FOREIGN KEY (user_id) REFERENCES aiops.users(user_id) ON DELETE CASCADE;

-- 9. 重建索引
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
CREATE INDEX idx_refresh_tokens_user_id ON aiops.refresh_tokens (user_id);
```

#### Session 表

```sql
-- 1. 添加新的 user_id 列（UUID）
ALTER TABLE aiops.sessions
ADD COLUMN user_id_uuid UUID;

-- 2. 迁移数据
UPDATE aiops.sessions s
SET user_id_uuid = u.user_id
FROM aiops.users u
WHERE s.user_id = u.id;

-- 3. 验证数据完整性
SELECT COUNT(*) FROM aiops.sessions WHERE user_id_uuid IS NULL;

-- 4. 删除旧的外键约束
ALTER TABLE aiops.sessions
DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

-- 5. 删除旧的 user_id 列
ALTER TABLE aiops.sessions
DROP COLUMN user_id;

-- 6. 重命名新列
ALTER TABLE aiops.sessions
RENAME COLUMN user_id_uuid TO user_id;

-- 7. 设置为 NOT NULL
ALTER TABLE aiops.sessions
ALTER COLUMN user_id SET NOT NULL;

-- 8. 添加新的外键约束
ALTER TABLE aiops.sessions
ADD CONSTRAINT fk_sessions_user_id
FOREIGN KEY (user_id) REFERENCES aiops.users(user_id) ON DELETE CASCADE;

-- 9. 重建索引
DROP INDEX IF EXISTS idx_sessions_user_id;
CREATE INDEX idx_sessions_user_id ON aiops.sessions (user_id);
```

#### AuditLog 表

```sql
-- 1. 添加新的 user_id 列（UUID，可为空）
ALTER TABLE aiops.audit_logs
ADD COLUMN user_id_uuid UUID;

-- 2. 迁移数据
UPDATE aiops.audit_logs al
SET user_id_uuid = u.user_id
FROM aiops.users u
WHERE al.user_id = u.id;

-- 3. 删除旧的 user_id 列
ALTER TABLE aiops.audit_logs
DROP COLUMN user_id;

-- 4. 重命名新列
ALTER TABLE aiops.audit_logs
RENAME COLUMN user_id_uuid TO user_id;

-- 5. 重建索引
DROP INDEX IF EXISTS idx_audit_logs_user_id;
CREATE INDEX idx_audit_logs_user_id ON aiops.audit_logs (user_id);

-- 注意：AuditLog 不需要外键约束，因为需要保留历史记录
```

---

## 二、Prisma Schema 修改

### 2.1 User 模型修改

```prisma
model User {
  id                 BigInt      @id @default(autoincrement())
  userId             String      @unique @default(uuid()) @map("user_id") @db.Uuid  // ✅ 新增
  accountNo          String      @unique @map("account_no")
  email              String      @unique
  passwordHash       String      @map("password_hash")
  username           String?
  avatar             String?
  status             user_status @default(active)
  lastLoginAt        DateTime?   @map("last_login_at")
  loginFailedCount   Int         @default(0) @map("login_failed_count")
  lockedUntil        DateTime?   @map("locked_until")
  createdAt          DateTime    @default(now()) @map("created_at")
  updatedAt          DateTime    @updatedAt @map("updated_at")

  // 关联关系
  userRoles     UserRole[]
  refreshTokens RefreshToken[]
  sessions      Session[]

  @@index([status])
  @@index([userId])      // ✅ 新增索引
  @@index([accountNo])
  @@index([email])
  @@schema("aiops")
  @@map("users")
}
```

### 2.2 关联表模型修改

```prisma
// UserRole 模型
model UserRole {
  id        BigInt   @id @default(autoincrement())
  userId    String   @map("user_id") @db.Uuid  // ❌ 改：BigInt → String
  roleId    BigInt   @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)  // ❌ 改
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@schema("aiops")
  @@map("user_roles")
}

// RefreshToken 模型
model RefreshToken {
  id           BigInt    @id @default(autoincrement())
  tokenHash    String    @unique @map("token_hash")
  deviceId     String?   @map("device_id")
  ipAddress    String?   @map("ip_address")
  userAgent    String?   @map("user_agent")
  userId       String    @map("user_id") @db.Uuid  // ❌ 改：BigInt → String
  expiresAt    DateTime  @map("expires_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  rotatedAt    DateTime? @map("rotated_at")
  revokedAt    DateTime? @map("revoked_at")

  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)  // ❌ 改

  @@index([userId])
  @@index([deviceId])
  @@schema("aiops")
  @@map("refresh_tokens")
}

// Session 模型
model Session {
  id             BigInt         @id @default(autoincrement())
  sessionId      String         @unique @map("session_id")
  title          String
  userId         String         @map("user_id") @db.Uuid  // ❌ 改：BigInt → String
  projectId      String         @default("global") @map("project_id")
  status         session_status @default(active)
  opencodeServer String         @default("http://127.0.0.1:4096") @map("opencode_server")
  directory      String?
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [userId], onDelete: Cascade)  // ❌ 改

  @@index([userId])
  @@index([status])
  @@index([updatedAt(sort: Desc)])
  @@schema("aiops")
  @@map("sessions")
}

// AuditLog 模型
model AuditLog {
  id         BigInt   @id @default(autoincrement())
  userId     String?  @map("user_id") @db.Uuid  // ❌ 改：BigInt? → String?
  action     String
  resource   String
  resourceId String?  @map("resource_id")
  details    Json?
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@schema("aiops")
  @@map("audit_logs")
}
```

---


## 三、后端代码修改

### 3.1 Repository 层修改

#### UserRepository

```typescript
// server/repositories/users.repository.ts

export class UserRepository extends BaseRepository<
  User,  // ✅ 改：any → User
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'user';
  }

  // 保持不变
  async findByAccountNo(accountNo: string) { ... }
  async findByEmail(email: string) { ... }

  // ✅ 新增：通过 userId (UUID) 查找用户
  async findByUserId(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { userId },
    });
  }

  // ❌ 改：参数从 bigint 改为 string
  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { userId },  // ❌ 改：id → userId
      data: { lastLoginAt: new Date() },
    });
  }

  // ❌ 改：参数从 bigint 改为 string
  async findWithRoles(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },  // ❌ 改：id → userId
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }
}
```

#### RefreshTokenRepository

```typescript
// server/repositories/refresh-tokens.repository.ts

export class RefreshTokenRepository extends BaseRepository<
  RefreshToken,  // ✅ 改：any → RefreshToken
  ...
> {
  // ❌ 改：userId 从 bigint 改为 string
  async createToken(
    userId: string,  // ❌ 改
    tokenHash: string,
    expiresAt: Date,
    meta?: { ... }
  ) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt, ...meta },
    });
  }

  // ❌ 改：userId 从 bigint 改为 string
  async findActiveTokensByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

#### SessionRepository

```typescript
// server/repositories/sessions.repository.ts
// ✅ 无需修改，已经使用 string 类型的 userId
```


### 3.2 Service 层修改

#### AuthService

```typescript
// server/services/auth/auth.service.ts

// ❌ 修改接口定义
export interface AuthResponse {
  user: {
    userId: string;      // ❌ 改：id: bigint → userId: string
    accountNo: string;
    email: string;
    username?: string | null;
    avatar?: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  // ❌ 修改 login 方法中的所有 user.id → user.userId
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await userRepository.findByAccountNo(input.accountNo);
    
    // 所有使用 user.id 的地方改为 user.userId
    await this.handleLoginFailure(user.userId, user.loginFailedCount);
    await this.resetLoginFailures(user.userId);
    
    const tokenPayload: Omit<JWTPayload, 'type'> = {
      userId: user.userId,  // ❌ 改
      accountNo: user.accountNo,
      email: user.email,
    };
    
    await this.persistRefreshToken(user.userId, refreshToken, {...});
    await userRepository.updateLastLogin(user.userId);
    
    return {
      user: {
        userId: user.userId,  // ❌ 改
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

  // ❌ 修改 register 方法
  async register(input: RegisterInput): Promise<AuthResponse> {
    const user = await this.prisma.user.create({...});
    
    // 分配默认角色
    await this.prisma.userRole.create({
      data: {
        userId: user.userId,  // ❌ 改
        roleId: userRole.id,
      },
    });
    
    const tokenPayload: Omit<JWTPayload, 'type'> = {
      userId: user.userId,  // ❌ 改
      accountNo: user.accountNo,
      email: user.email,
    };
    
    await this.persistRefreshToken(user.userId, refreshToken, {...});
    
    return {
      user: {
        userId: user.userId,  // ❌ 改
        // ...
      },
      // ...
    };
  }

  // ❌ 修改 me 方法签名
  async me(userId: string) {  // ❌ 改：bigint → string
    const user = await userRepository.findByUserId(userId);
    const { permissions, roles } = await this.getUserPermissionsAndRoles(user.userId);
    
    return {
      user: {
        userId: user.userId,  // ❌ 改
        // ...
      },
      // ...
    };
  }

  // ❌ 修改私有方法签名
  private async getUserPermissionsAndRoles(userId: string) { ... }  // ❌ 改
  private async persistRefreshToken(userId: string, ...) { ... }    // ❌ 改
  private async handleLoginFailure(userId: string, ...) { ... }     // ❌ 改
  private async resetLoginFailures(userId: string) { ... }          // ❌ 改
}
```

#### JWTService

```typescript
// server/services/auth/jwt.service.ts

export interface JWTPayload {
  userId: string;  // ❌ 改：bigint → string
  accountNo: string;
  email: string;
  type: 'access' | 'refresh';
}

export class JWTService {
  generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },  // ❌ 改：移除 .toString()
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },  // ❌ 改：移除 .toString()
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  verify(token: string): JWTPayload {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      ...decoded,
      userId: decoded.userId,  // ❌ 改：移除 BigInt() 转换
    };
  }
}
```

#### SessionsService

```typescript
// server/services/sessions.service.ts
// ✅ 无需修改，已经使用 string 类型的 userId
```


### 3.3 Middleware 层修改

#### JWT Auth Middleware

```typescript
// server/middleware/jwt-auth.middleware.ts

declare global {
  namespace Express {
    interface Request {
      userId?: string;  // ✅ 新增：方便直接访问
      user?: {
        userId: string;      // ❌ 改：id: bigint → userId: string
        accountNo: string;
        email: string;
      };
    }
  }
}

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verify(token);

    if (payload.type !== 'access') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
      });
    }

    // ❌ 改：将用户信息注入请求
    req.user = {
      userId: payload.userId,  // ❌ 改：id → userId
      accountNo: payload.accountNo,
      email: payload.email,
    };
    
    req.userId = payload.userId;  // ✅ 新增：方便直接访问

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}
```

### 3.4 Controller 层修改

```typescript
// server/controllers/sessions.controller.ts
// ✅ 无需修改，已经使用 req.userId (string 类型)

// server/controllers/auth.controller.ts
// ✅ 无需修改，AuthService 已经返回正确的类型

// server/controllers/users.controller.ts
// ✅ 无需修改，使用 Prisma 自动生成的类型
```

