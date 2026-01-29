# RBAC 系统测试指南

## 📋 目录

- [概述](#概述)
- [测试环境准备](#测试环境准备)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [前端测试](#前端测试)
- [E2E 测试](#e2e-测试)
- [测试覆盖率](#测试覆盖率)
- [测试最佳实践](#测试最佳实践)

---

## 概述

本文档提供 RBAC 权限管理系统的完整测试指南，包括单元测试、集成测试、前端测试和 E2E 测试。

### 测试技术栈

| 类型 | 技术 | 说明 |
|------|------|------|
| 单元测试 | Vitest | 快速的单元测试框架 |
| 集成测试 | Vitest + Supertest | API 集成测试 |
| 前端测试 | @testing-library/react | React 组件测试 |
| E2E 测试 | Playwright | 端到端测试 |
| 覆盖率 | Vitest Coverage | 代码覆盖率统计 |

---

## 测试环境准备

### 1. 安装测试依赖

```bash
# 安装 Vitest 和相关依赖
pnpm add -D vitest @vitest/ui @vitest/coverage-v8

# 安装 Supertest（API 测试）
pnpm add -D supertest @types/supertest

# 安装 React Testing Library
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# 安装 Playwright（E2E 测试）
pnpm add -D @playwright/test
pnpm exec playwright install
```

### 2. 配置 Vitest

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. 测试数据库配置

创建测试数据库环境变量 `.env.test`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
JWT_SECRET="test-secret-key-for-testing-only"
JWT_REFRESH_SECRET="test-refresh-secret-key"
```

### 4. 运行测试命令

在 `package.json` 中添加测试脚本:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## 单元测试

### 1. 密码服务测试

测试密码加密和验证功能。

**文件**: `server/services/auth/__tests__/password.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { passwordService } from '../password.service'

describe('PasswordService', () => {
  it('should hash password', async () => {
    const password = 'password123'
    const hash = await passwordService.hash(password)

    expect(hash).not.toBe(password)
    expect(hash).toMatch(/^\$2[aby]\$/)
  })

  it('should verify correct password', async () => {
    const password = 'password123'
    const hash = await passwordService.hash(password)
    const isValid = await passwordService.verify(password, hash)

    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const hash = await passwordService.hash('password123')
    const isValid = await passwordService.verify('wrongpassword', hash)

    expect(isValid).toBe(false)
  })
})
```

### 2. 权限中间件测试

**文件**: `server/middleware/__tests__/permission.middleware.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { requirePermission } from '../permission.middleware'

describe('Permission Middleware', () => {
  it('should allow access with correct permission', () => {
    const req = { user: { permissions: ['user:view'] } }
    const res = {}
    const next = vi.fn()

    requirePermission('user:view')(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('should deny access without permission', () => {
    const req = { user: { permissions: [] } }
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next = vi.fn()

    requirePermission('user:delete')(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
```

---

## 集成测试

### 登录接口测试

```typescript
// server/__tests__/auth.integration.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../index'

describe('Auth Integration Tests', () => {
  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ accountNo: 'admin', password: 'admin123' })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
  })

  it('should rotate refresh token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ accountNo: 'admin', password: 'admin123' })

    const refreshCookie = login.get('Set-Cookie')
      .find(cookie => cookie.startsWith('refreshToken'))

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)

    expect(refresh.status).toBe(200)
    expect(refresh.body.accessToken).toBeDefined()
  })
})
```

---

## 前端测试

### PermissionGuard 组件测试

```typescript
// src/components/__tests__/permission-guard.test.tsx
import { render, screen } from '@testing-library/react'
import { PermissionGuard } from '../permission-guard'
import { useAuthStore } from '@/stores/auth-store'

describe('PermissionGuard', () => {
  it('should render children with permission', () => {
    useAuthStore.setState({
      user: { permissions: ['user:create'] }
    })

    render(
      <PermissionGuard permission="user:create">
        <button>Create User</button>
      </PermissionGuard>
    )

    expect(screen.getByText('Create User')).toBeInTheDocument()
  })

  it('should not render without permission', () => {
    useAuthStore.setState({
      user: { permissions: [] }
    })

    render(
      <PermissionGuard permission="user:create">
        <button>Create User</button>
      </PermissionGuard>
    )

    expect(screen.queryByText('Create User')).not.toBeInTheDocument()
  })
})
```

---

## E2E 测试

### Playwright 配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'pnpm dev',
    port: 5173,
  },
})
```

### 登录流程 E2E 测试

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('login and access protected page', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('[name="accountNo"]', 'admin')
  await page.fill('[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('text=欢迎')).toBeVisible()
})

test('permission guard hides unauthorized buttons', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="accountNo"]', 'user')
  await page.fill('[name="password"]', 'user123')
  await page.click('button[type="submit"]')
  
  await page.goto('/users')
  await expect(page.locator('text=创建用户')).not.toBeVisible()
})
```

---

## 测试覆盖率

### 运行覆盖率测试

```bash
pnpm test:coverage
```

### 覆盖率目标

- 单元测试覆盖率: ≥ 80%
- 集成测试覆盖率: ≥ 70%
- 关键路径覆盖率: 100%

---

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 格式: `should [expected behavior] when [condition]`
- 示例: `should return 401 when password is incorrect`

### 2. 测试隔离

- 每个测试独立运行
- 使用 beforeEach/afterEach 清理状态
- 避免测试之间的依赖

### 3. Mock 数据

- 使用一致的测试数据
- 避免硬编码敏感信息
- 使用工厂函数生成测试数据

### 4. 异步测试

- 使用 async/await
- 正确处理 Promise
- 设置合理的超时时间

---

**文档版本**: 1.0
**最后更新**: 2026-01-29
