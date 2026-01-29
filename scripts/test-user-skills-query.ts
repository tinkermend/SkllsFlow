/**
 * 测试通过 UUID 查询用户技能
 */
import { DatabaseService } from '../server/services/database.service.js';
import { SkillsRepository } from '../server/repositories/skills.repository.js';

async function testUserSkillsQuery() {
  // 先连接数据库
  await DatabaseService.connect();
  const prisma = DatabaseService.getInstance();
  const repository = new SkillsRepository(prisma);

  try {
    console.log('=== 测试通过 UUID 查询用户技能 ===\n');

    // 测试用户 UUID（admin 用户）
    const testUserUuid = '3a00f1a8-12d2-4f77-83b3-424a04e19f01';

    console.log(`1. 查询用户 UUID: ${testUserUuid}`);

    // 通过 UUID 查询用户技能
    const skills = await repository.findUserSkillsByUuid(testUserUuid);

    console.log(`\n2. 查询结果: 找到 ${skills.length} 个技能\n`);

    if (skills.length > 0) {
      skills.forEach((skill, index) => {
        console.log(`技能 ${index + 1}:`);
        console.log(`  - ID: ${skill.skillId}`);
        console.log(`  - 名称: ${skill.name}`);
        console.log(`  - 描述: ${skill.description}`);
        console.log(`  - 状态: ${skill.status}`);
        console.log('');
      });
    } else {
      console.log('该用户暂无技能');
    }

    console.log('✅ 测试成功！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  } finally {
    await DatabaseService.disconnect();
  }
}

testUserSkillsQuery();
