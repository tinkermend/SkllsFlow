import { DatabaseService } from '../server/services/database.service.js';

async function assignPermissionsToAdmin() {
  try {
    console.log('🔄 开始为 admin 角色分配新权限...\n');

    await DatabaseService.connect();
    const prisma = DatabaseService.getInstance();

    // 1. 获取 admin 角色
    const adminRole = await prisma.role.findUnique({
      where: { code: 'admin' },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });

    if (!adminRole) {
      console.error('❌ 未找到 admin 角色');
      return;
    }

    console.log(`📋 admin 角色当前有 ${adminRole.rolePermissions.length} 个权限\n`);

    // 2. 获取所有权限
    const allPermissions = await prisma.permission.findMany();
    console.log(`📋 数据库中共有 ${allPermissions.length} 个权限\n`);

    // 3. 找出 admin 角色还没有的权限
    const existingPermissionIds = new Set(
      adminRole.rolePermissions.map(rp => rp.permissionId.toString())
    );

    const missingPermissions = allPermissions.filter(
      p => !existingPermissionIds.has(p.id.toString())
    );

    if (missingPermissions.length === 0) {
      console.log('✅ admin 角色已拥有所有权限，无需分配');
      return;
    }

    console.log(`🔍 发现 ${missingPermissions.length} 个未分配的权限:\n`);
    missingPermissions.forEach(p => {
      console.log(`   - ${p.code}: ${p.name}`);
    });

    // 4. 分配缺失的权限
    console.log('\n🔄 开始分配权限...\n');

    await prisma.rolePermission.createMany({
      data: missingPermissions.map(p => ({
        roleId: adminRole.id,
        permissionId: p.id,
      })),
    });

    console.log(`✅ 成功为 admin 角色分配 ${missingPermissions.length} 个新权限！`);

  } catch (error: any) {
    console.error('❌ 分配失败:', error.message);
    console.error(error.stack);
  } finally {
    await DatabaseService.disconnect();
  }
}

assignPermissionsToAdmin();
