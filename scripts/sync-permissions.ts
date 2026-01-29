import { DatabaseService } from '../server/services/database.service.js';
import { PERMISSIONS } from '../src/config/permissions.js';

async function syncPermissions() {
  try {
    console.log('🔄 开始同步权限到数据库...\n');

    await DatabaseService.connect();
    const prisma = DatabaseService.getInstance();

    console.log(`📋 配置文件中共有 ${PERMISSIONS.length} 个权限\n`);

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const perm of PERMISSIONS) {
        const existing = await tx.permission.findUnique({
          where: { code: perm.code },
        });

        if (existing) {
          await tx.permission.update({
            where: { code: perm.code },
            data: {
              name: perm.name,
              resource: perm.resource,
              action: perm.action,
              module: perm.module,
              description: perm.description || null,
            },
          });
          updated++;
          console.log(`✏️  更新: ${perm.code} - ${perm.name}`);
        } else {
          await tx.permission.create({
            data: {
              code: perm.code,
              name: perm.name,
              resource: perm.resource,
              action: perm.action,
              module: perm.module,
              description: perm.description || null,
            },
          });
          created++;
          console.log(`✨ 创建: ${perm.code} - ${perm.name}`);
        }
      }
    });

    console.log(`\n✅ 同步完成！`);
    console.log(`   新增: ${created} 个权限`);
    console.log(`   更新: ${updated} 个权限`);

  } catch (error: any) {
    console.error('❌ 同步失败:', error.message);
    console.error(error.stack);
  } finally {
    await DatabaseService.disconnect();
  }
}

syncPermissions();
