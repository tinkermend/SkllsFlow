import { http, HttpResponse, delay } from 'msw'
import { mockSkills, mockSessionSkills } from './data/skills'
import { mockUsers } from './data/users'
import { MOCK_DELAYS } from './utils/delay'

/**
 * MSW API Handlers
 *
 * 定义所有 Mock API 端点的拦截规则和响应逻辑
 */

export const handlers = [
  // ==================== Skills API ====================

  // GET /api/skills - 获取技能列表
  http.get('/api/skills', async () => {
    await delay(MOCK_DELAYS.normal)
    return HttpResponse.json(mockSkills)
  }),

  // GET /api/skills/:id - 获取技能详情
  http.get('/api/skills/:id', async ({ params }) => {
    await delay(150)
    const { id } = params
    const skill = mockSkills.find(s => s.skillId === id)

    if (!skill) {
      return HttpResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(skill)
  }),

  // POST /api/skills - 创建技能
  http.post('/api/skills', async ({ request }) => {
    await delay(MOCK_DELAYS.slow)
    const data = await request.json()
    const newSkill = {
      ...data,
      id: mockSkills.length + 1,
      skillId: `skill_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockSkills.push(newSkill)
    return HttpResponse.json(newSkill, { status: 201 })
  }),

  // PATCH /api/skills/:id - 更新技能
  http.patch('/api/skills/:id', async ({ params, request }) => {
    await delay(MOCK_DELAYS.normal)
    const { id } = params
    const updates = await request.json()
    const index = mockSkills.findIndex(s => s.skillId === id)

    if (index === -1) {
      return HttpResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    mockSkills[index] = {
      ...mockSkills[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return HttpResponse.json(mockSkills[index])
  }),

  // DELETE /api/skills/:id - 删除技能
  http.delete('/api/skills/:id', async ({ params }) => {
    await delay(MOCK_DELAYS.normal)
    const { id } = params
    const index = mockSkills.findIndex(s => s.skillId === id)

    if (index === -1) {
      return HttpResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    mockSkills.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /api/skills/upload - 上传技能压缩包
  http.post('/api/skills/upload', async ({ request }) => {
    await delay(MOCK_DELAYS.slow)
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return HttpResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // 模拟文件上传,返回文件路径
    const filePath = `/uploads/skills/${Date.now()}-${file.name}`
    return HttpResponse.json({ filePath })
  }),

  // GET /api/skills/:id/sessions - 获取技能关联会话列表
  http.get('/api/skills/:id/sessions', async ({ params }) => {
    await delay(150)
    const { id } = params

    // 从 mock 数据中查找关联会话
    const sessions = mockSessionSkills[id] || []

    return HttpResponse.json(sessions)
  }),

  // ==================== Users API ====================

  // GET /api/users - 获取用户列表
  http.get('/api/users', async () => {
    await delay(MOCK_DELAYS.normal)
    return HttpResponse.json(mockUsers)
  }),

  // GET /api/users/:id - 获取用户详情
  http.get('/api/users/:id', async ({ params }) => {
    await delay(150)
    const { id } = params
    const user = mockUsers.find(u => u.id === id)

    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json(user)
  }),

  // POST /api/users - 创建用户
  http.post('/api/users', async ({ request }) => {
    await delay(MOCK_DELAYS.slow)
    const data = await request.json()
    const newUser = {
      ...data,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    mockUsers.push(newUser)
    return HttpResponse.json(newUser, { status: 201 })
  }),

  // PATCH /api/users/:id - 更新用户
  http.patch('/api/users/:id', async ({ params, request }) => {
    await delay(MOCK_DELAYS.normal)
    const { id } = params
    const updates = await request.json()
    const index = mockUsers.findIndex(u => u.id === id)

    if (index === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    mockUsers[index] = { ...mockUsers[index], ...updates }
    return HttpResponse.json(mockUsers[index])
  }),

  // DELETE /api/users/:id - 删除用户
  http.delete('/api/users/:id', async ({ params }) => {
    await delay(MOCK_DELAYS.normal)
    const { id } = params
    const index = mockUsers.findIndex(u => u.id === id)

    if (index === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    mockUsers.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
