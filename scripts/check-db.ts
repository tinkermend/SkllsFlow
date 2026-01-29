import { DatabaseService } from '../server/services/database.service.js';

async function checkDatabase() {
  try {
    console.log('🔍 正在检查数据库...\n');

    // 先连接数据库
    await DatabaseService.connect();
    const prisma = DatabaseService.getInstance();

    // 检查角色数量
    const roleCount = await prisma.role.count();
    console.log(`✅ 角色总数: ${roleCount}`);

    if (roleCount > 0) {
      const roles = await prisma.role.findMany({
        take: 5,
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      console.log('\n📋 角色列表:');
      roles.forEach(role => {
        console.log(`  - ID: ${role.id}`);
        console.log(`    名称: ${role.name}`);
        console.log(`    代码: ${role.code}`);
        console.log(`    状态: ${role.status}`);
        console.log(`    权限数: ${role.rolePermissions.length}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  数据库中没有角色数据！');
      console.log('请运行种子数据脚本: pnpm exec prisma db seed');
    }

    // 检查权限数量
    const permissionCount = await prisma.permission.count();
    console.log(`✅ 权限总数: ${permissionCount}`);

    // 检查用户数量
    const userCount = await prisma.user.count();
    console.log(`✅ 用户总数: ${userCount}`);

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
    console.error('详细信息:', error);
  } finally {
    await DatabaseService.disconnect();
  }
}

checkDatabase();
