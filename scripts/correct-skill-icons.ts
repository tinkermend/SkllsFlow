 
/**
 * 修正技能表中的图标字段为 Lucide React 实际支持的名称
 */
import { DatabaseService } from '../server/services/database.service.js';

// 图标名称修正映射表（数据库中的名称 -> Lucide React 实际名称）
const ICON_CORRECTION_MAP: Record<string, string> = {
  'Code2': 'Code',
  'BarChart3': 'BarChart3',
  'BarChart2': 'BarChart2',
  'BarChart': 'BarChart',
};

async function correctSkillIcons() {
  await DatabaseService.connect();
  const prisma = DatabaseService.getInstance();

  try {
    console.log('=== 开始修正技能图标名称 ===\n');

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

    // 2. 修正每个技能的图标
    for (const skill of skills) {
      const oldIcon = skill.icon;

      if (!oldIcon) {
        console.log(`⏭️  跳过: ${skill.name} (无图标)\n`);
        continue;
      }

      const newIcon = ICON_CORRECTION_MAP[oldIcon] || oldIcon;

      if (newIcon !== oldIcon) {
        // 更新数据库
        await prisma.skill.update({
          where: { id: skill.id },
          data: { icon: newIcon },
        });

        console.log(`✅ 修正: ${skill.name}`);
        console.log(`   ${oldIcon} -> ${newIcon}\n`);
      } else {
        console.log(`✓ 正确: ${skill.name} (图标: ${oldIcon})\n`);
      }
    }

    console.log('✅ 所有图标修正完成！');
  } catch (error) {
    console.error('❌ 修正失败:', error);
    throw error;
  } finally {
    await DatabaseService.disconnect();
  }
}

correctSkillIcons();
