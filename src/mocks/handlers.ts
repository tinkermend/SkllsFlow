import { http, HttpResponse, delay } from "msw";
import { mockSkills, mockSessionSkills } from "./data/skills";
import { mockUsers, mockUserCredentials } from "./data/users";
import { MOCK_DELAYS } from "./utils/delay";

/**
 * Mock 会话存储
 * 用于存储登录后的 token 和用户信息
 */
const mockSessions = new Map<string, { userId: string; expiresAt: number }>();
const mockRefreshTokens = new Map<string, { userId: string; expiresAt: number }>();

/**
 * 生成 Mock JWT Token
 */
function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`;
}

/**
 * 生成 Mock Refresh Token
 */
function generateMockRefreshToken(userId: string): string {
  return `mock_refresh_${userId}_${Date.now()}`;
}

/**
 * 验证 Token
 */
function validateToken(token: string): string | null {
  const session = mockSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return null;
  }
  return session.userId;
}

/**
 * MSW API Handlers
 *
 * 定义所有 Mock API 端点的拦截规则和响应逻辑
 */

export const handlers = [
  // ==================== Auth API ====================

  // POST /api/auth/login - 用户登录
  http.post("/api/auth/login", async ({ request }) => {
    await delay(MOCK_DELAYS.normal);
    const body = (await request.json()) as { accountNo: string; password: string };

    // 验证用户凭证
    const credentials = mockUserCredentials.find(
      (c) => c.accountNo === body.accountNo && c.password === body.password
    );

    if (!credentials) {
      return HttpResponse.json(
        { error: "Invalid credentials", message: "账号或密码错误" },
        { status: 401 }
      );
    }

    // 查找用户信息
    const user = mockUsers.find((u) => u.id === credentials.userId);
    if (!user) {
      return HttpResponse.json(
        { error: "User not found", message: "用户不存在" },
        { status: 404 }
      );
    }

    // 生成 token
    const accessToken = generateMockToken(user.id);
    const refreshToken = generateMockRefreshToken(user.id);

    // 存储会话（access token 有效期 15 分钟）
    mockSessions.set(accessToken, {
      userId: user.id,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    // 存储刷新令牌（有效期 7 天）
    mockRefreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return HttpResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  }),

  // POST /api/auth/logout - 用户登出
  http.post("/api/auth/logout", async ({ request }) => {
    await delay(MOCK_DELAYS.fast);
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      mockSessions.delete(token);
    }

    return HttpResponse.json({ message: "Logged out successfully" });
  }),

  // POST /api/auth/refresh - 刷新令牌
  http.post("/api/auth/refresh", async ({ request }) => {
    await delay(MOCK_DELAYS.fast);
    const body = (await request.json()) as { refreshToken: string };

    const session = mockRefreshTokens.get(body.refreshToken);
    if (!session || session.expiresAt < Date.now()) {
      return HttpResponse.json(
        { error: "Invalid refresh token", message: "刷新令牌无效或已过期" },
        { status: 401 }
      );
    }

    // 生成新的 access token
    const accessToken = generateMockToken(session.userId);
    mockSessions.set(accessToken, {
      userId: session.userId,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    return HttpResponse.json({ accessToken });
  }),

  // GET /api/auth/me - 获取当前用户信息
  http.get("/api/auth/me", async ({ request }) => {
    await delay(MOCK_DELAYS.fast);
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return HttpResponse.json(
        { error: "Unauthorized", message: "未提供认证令牌" },
        { status: 401 }
      );
    }

    const userId = validateToken(token);
    if (!userId) {
      return HttpResponse.json(
        { error: "Unauthorized", message: "令牌无效或已过期" },
        { status: 401 }
      );
    }

    const user = mockUsers.find((u) => u.id === userId);
    if (!user) {
      return HttpResponse.json(
        { error: "User not found", message: "用户不存在" },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  }),

  // ==================== Skills API ====================
  // ==================== Skills API ====================

  // GET /api/skills - 获取技能列表
  http.get("/api/skills", async () => {
    await delay(MOCK_DELAYS.normal);
    return HttpResponse.json(mockSkills);
  }),

  // GET /api/skills/:id - 获取技能详情
  http.get("/api/skills/:id", async ({ params }) => {
    await delay(150);
    const { id } = params;
    const skill = mockSkills.find((s) => s.skillId === id);

    if (!skill) {
      return HttpResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return HttpResponse.json(skill);
  }),

  // POST /api/skills - 创建技能
  http.post("/api/skills", async ({ request }) => {
    await delay(MOCK_DELAYS.slow);
    const data = (await request.json()) as any;
    const newSkill = {
      ...data,
      id: mockSkills.length + 1,
      skillId: `skill_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockSkills.push(newSkill);
    return HttpResponse.json(newSkill, { status: 201 });
  }),

  // PATCH /api/skills/:id - 更新技能
  http.patch("/api/skills/:id", async ({ params, request }) => {
    await delay(MOCK_DELAYS.normal);
    const { id } = params;
    const updates = (await request.json()) as any;
    const index = mockSkills.findIndex((s) => s.skillId === id);

    if (index === -1) {
      return HttpResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    mockSkills[index] = {
      ...mockSkills[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockSkills[index]);
  }),

  // DELETE /api/skills/:id - 删除技能
  http.delete("/api/skills/:id", async ({ params }) => {
    await delay(MOCK_DELAYS.normal);
    const { id } = params;
    const index = mockSkills.findIndex((s) => s.skillId === id);

    if (index === -1) {
      return HttpResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    mockSkills.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/skills/upload - 上传技能压缩包
  http.post("/api/skills/upload", async ({ request }) => {
    await delay(MOCK_DELAYS.slow);
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return HttpResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 模拟文件上传,返回文件路径
    const filePath = `/uploads/skills/${Date.now()}-${file.name}`;
    return HttpResponse.json({ filePath });
  }),

  // GET /api/skills/:id/sessions - 获取技能关联会话列表
  http.get("/api/skills/:id/sessions", async ({ params }) => {
    await delay(150);
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // 从 mock 数据中查找关联会话
    const sessions = mockSessionSkills[id || ""] || [];

    return HttpResponse.json(sessions);
  }),

  // ==================== Users API ====================

  // GET /api/users - 获取用户列表
  http.get("/api/users", async () => {
    await delay(MOCK_DELAYS.normal);
    return HttpResponse.json(mockUsers);
  }),

  // GET /api/users/:id - 获取用户详情
  http.get("/api/users/:id", async ({ params }) => {
    await delay(150);
    const { id } = params;
    const user = mockUsers.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }

    return HttpResponse.json(user);
  }),

  // POST /api/users - 创建用户
  http.post("/api/users", async ({ request }) => {
    await delay(MOCK_DELAYS.slow);
    const data = (await request.json()) as any;
    const newUser = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // PATCH /api/users/:id - 更新用户
  http.patch("/api/users/:id", async ({ params, request }) => {
    await delay(MOCK_DELAYS.normal);
    const { id } = params;
    const updates = (await request.json()) as any;
    const index = mockUsers.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }

    mockUsers[index] = { ...mockUsers[index], ...updates };
    return HttpResponse.json(mockUsers[index]);
  }),

  // DELETE /api/users/:id - 删除用户
  http.delete("/api/users/:id", async ({ params }) => {
    await delay(MOCK_DELAYS.normal);
    const { id } = params;
    const index = mockUsers.findIndex((u) => u.id === id);

    if (index === -1) {
      return HttpResponse.json({ error: "User not found" }, { status: 404 });
    }

    mockUsers.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
