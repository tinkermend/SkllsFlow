 
 
import { DatabaseService } from '../server/services/database.service.js';
import { getRBACService } from '../server/services/auth/rbac.service.js';

async function checkPermissionView() {
  try {
    console.log('🔍 检查 permission:view 权限...\n');

    await DatabaseService.connect();
    const rbacService = getRBACService();
    const prisma = DatabaseService.getInstance();

    // admin 用户的 UUID
    const userUUID = '3a00f1a8-12d2-4f77-83b3-424a04e19f01';

    // 1. 检查数据库中是否有 permission:view 权限
    console.log('1️⃣ 检查数据库中是否存在 permission:view:');
    const permissionExists = await prisma.permission.findFirst({
      where: { code: 'permission:view' }
    });
    console.log(`   结果: ${permissionExists ? '✅ 存在' : '❌ 不存在'}`);
    if (permissionExists) {
      console.log(`   权限信息: ID=${permissionExists.id}, 名称=${permissionExists.name}`);
    }

    // 2. 获取 admin 用户的所有权限
    console.log('\n2️⃣ 获取 admin 用户的所有权限:');
    const userPermissions = await rbacService.getUserPermissions(userUUID);
    console.log(`   权限总数: ${userPermissions.length}`);
    console.log(`   权限列表: ${userPermissions.join(', ')}`);

    // 3. 检查是否包含 permission:view
    console.log('\n3️⃣ 检查 admin 是否有 permission:view 权限:');
    const hasPermission = userPermissions.includes('permission:view');
    console.log(`   结果: ${hasPermission ? '✅ 有权限' : '❌ 无权限'}`);

    // 4. 使用 RBAC 服务检查
    console.log('\n4️⃣ 使用 RBAC 服务检查:');
    const hasPermissionViaRBAC = await rbacService.hasPermission(userUUID, 'permission:view');
    console.log(`   结果: ${hasPermissionViaRBAC ? '✅ 有权限' : '❌ 无权限'}`);

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  } finally {
    await DatabaseService.disconnect();
  }
}

checkPermissionView();
