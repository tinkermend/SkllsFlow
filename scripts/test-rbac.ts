import { DatabaseService } from '../server/services/database.service.js';
import { getRBACService } from '../server/services/auth/rbac.service.js';

async function testRBAC() {
  try {
    console.log('🧪 测试 RBAC 服务...\n');

    // 连接数据库
    await DatabaseService.connect();
    const rbacService = getRBACService();

    // 测试用户 UUID (admin)
    const userUUID = '3a00f1a8-12d2-4f77-83b3-424a04e19f01';

    console.log('1️⃣ 测试获取用户权限:');
    try {
      const permissions = await rbacService.getUserPermissions(userUUID);
      console.log(`   ✅ 用户权限数量: ${permissions.length}`);
      console.log(`   权限列表: ${permissions.slice(0, 5).join(', ')}...`);
    } catch (error: any) {
      console.error(`   ❌ 错误: ${error.message}`);
      console.error(`   堆栈: ${error.stack}`);
    }

    console.log('\n2️⃣ 测试检查权限 (role:view):');
    try {
      const hasPermission = await rbacService.hasPermission(userUUID, 'role:view');
      console.log(`   结果: ${hasPermission ? '✅ 有权限' : '❌ 无权限'}`);
    } catch (error: any) {
      console.error(`   ❌ 错误: ${error.message}`);
      console.error(`   堆栈: ${error.stack}`);
    }

    console.log('\n3️⃣ 测试检查所有权限 (role:view):');
    try {
      const hasAllPermissions = await rbacService.hasAllPermissions(userUUID, ['role:view']);
      console.log(`   结果: ${hasAllPermissions ? '✅ 有权限' : '❌ 无权限'}`);
    } catch (error: any) {
      console.error(`   ❌ 错误: ${error.message}`);
      console.error(`   堆栈: ${error.stack}`);
    }

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    console.error('堆栈:', error.stack);
  } finally {
    await DatabaseService.disconnect();
  }
}

testRBAC();
