import { describe, expect, it } from 'vitest'
import { PERMISSIONS, getPermissionsByModule } from './permissions'

describe('permissions config', () => {
  it('includes all permissions referenced by current menu and action guards', () => {
    const codes = new Set(PERMISSIONS.map((permission) => permission.code))

    expect(codes.has('user:assign-roles')).toBe(true)
    expect(codes.has('session:update')).toBe(true)
    expect(codes.has('chatServer:create')).toBe(true)
    expect(codes.has('chatServer:update')).toBe(true)
    expect(codes.has('chatServer:delete')).toBe(true)
    expect(codes.has('menu:view')).toBe(true)
    expect(codes.has('menu:create')).toBe(true)
    expect(codes.has('menu:update')).toBe(true)
    expect(codes.has('menu:delete')).toBe(true)
  })

  it('includes skill install and uninstall permissions', () => {
    const codes = PERMISSIONS.map((permission) => permission.code)

    expect(codes).toContain('skill:install')
    expect(codes).toContain('skill:uninstall')
  })

  it('groups all skill permissions under 技能管理 module', () => {
    const grouped = getPermissionsByModule()
    const skillCodes = grouped['技能管理']?.map((permission) => permission.code) ?? []

    expect(skillCodes).toEqual(
      expect.arrayContaining(['skill:view', 'skill:create', 'skill:update', 'skill:delete', 'skill:install', 'skill:uninstall'])
    )
  })

  it('does not keep the obsolete singular assign-role permission code', () => {
    const codes = PERMISSIONS.map((permission) => permission.code)

    expect(codes).not.toContain('user:assign-role')
    expect(codes).toContain('user:assign-roles')
  })
})
