 
/**
 * 更新技能表中的图标字段
 * 将 "lucide:code-2" 格式转换为 "CodeXml" 格式
 */
import { DatabaseService } from '../server/services/database.service.js';

async function updateSkillIcons() {
  await DatabaseService.connect();
  const prisma = DatabaseService.getInstance();

  try {
    console.log('=== 开始更新技能图标 ===\n');

    // 1. 获取所有技能
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        skillId: true,
        name: true,
        icon: true,
      },
    });

    console.log(`找到 ${skills.length} 个技能\n`);

    // 2. 更新每个技能的图标
    for (const skill of skills) {
      const oldIcon = skill.icon;
      let newIcon = oldIcon;

      // 检查是否需要转换
      if (oldIcon && oldIcon.startsWith('lucide:')) {
        // 移除 "lucide:" 前缀
        const iconName = oldIcon.replace('lucide:', '');

        // 转换为 PascalCase
        newIcon = iconName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');

        // 更新数据库
        await prisma.skill.update({
          where: { id: skill.id },
          data: { icon: newIcon },
        });

        console.log(`✅ 更新: ${skill.name}`);
        console.log(`   ${oldIcon} -> ${newIcon}\n`);
      } else {
        console.log(`⏭️  跳过: ${skill.name} (图标: ${oldIcon})\n`);
      }
    }

    console.log('✅ 所有图标更新完成！');
  } catch (error) {
    console.error('❌ 更新失败:', error);
    throw error;
  } finally {
    await DatabaseService.disconnect();
  }
}

updateSkillIcons();
