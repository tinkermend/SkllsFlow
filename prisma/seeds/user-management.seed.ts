import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aiops';

// 创建连接池
const pool = new Pool({
  connectionString: DATABASE_URL,
});

// 创建 Prisma Client
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedUserManagement() {
  console.log('开始创建用户管理种子数据...\n');

  // 1. 创建权限
  console.log('1. 创建权限...');
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { code: 'user:view' },
      update: {},
      create: {
        name: '查看用户',
        code: 'user:view',
        resource: 'user',
        action: 'view',
        description: '查看用户列表和详情',
        module: 'users',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'user:create' },
      update: {},
      create: {
        name: '创建用户',
        code: 'user:create',
        resource: 'user',
        action: 'create',
        description: '创建新用户',
        module: 'users',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'user:update' },
      update: {},
      create: {
        name: '更新用户',
        code: 'user:update',
        resource: 'user',
        action: 'update',
        description: '更新用户信息',
        module: 'users',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'user:delete' },
      update: {},
      create: {
        name: '删除用户',
        code: 'user:delete',
        resource: 'user',
        action: 'delete',
        description: '删除用户',
        module: 'users',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'user:assign-roles' },
      update: {},
      create: {
        name: '分配角色',
        code: 'user:assign-roles',
        resource: 'user',
        action: 'assign-roles',
        description: '为用户分配角色',
        module: 'users',
      },
    }),
  ]);

  console.log(`✓ 创建了 ${permissions.length} 个权限\n`);

  // 2. 创建超级管理员角色
  console.log('2. 创建超级管理员角色...');
  const superadminRole = await prisma.role.upsert({
    where: { code: 'superadmin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'superadmin',
      description: '拥有所有权限的超级管理员',
      isSystem: true,
      sort: 0,
      status: 'active',
    },
  });

  console.log('✓ 超级管理员角色创建完成\n');

  // 3. 为超级管理员角色分配所有权限
  console.log('3. 为超级管理员角色分配权限...');
  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superadminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superadminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );

  console.log('✓ 角色权限关联完成\n');

  // 4. 创建默认管理员用户
  console.log('4. 创建默认管理员用户...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { accountNo: 'admin' },
    update: {},
    create: {
      accountNo: 'admin',
      email: 'admin@example.com',
      passwordHash,
      username: '系统管理员',
      status: 'active',
    },
  });

  console.log('✓ 管理员用户创建完成\n');

  // 5. 为管理员用户分配超级管理员角色
  console.log('5. 为管理员用户分配角色...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superadminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superadminRole.id,
    },
  });

  console.log('✓ 用户角色关联完成\n');
  console.log('========================================');
  console.log('种子数据创建完成！');
  console.log('========================================');
  console.log('\n默认管理员账号:');
  console.log('  账号: admin');
  console.log('  密码: Admin@123');
  console.log('  邮箱: admin@example.com\n');
}

seedUserManagement()
  .catch((e) => {
    console.error('种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
