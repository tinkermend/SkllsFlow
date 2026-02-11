 
/**
 * 从 Prisma Schema 提取注释并生成 PostgreSQL COMMENT 语句
 * 使用方法：pnpm tsx scripts/generate-db-comments.ts
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
const OUTPUT_PATH = path.join(process.cwd(), 'prisma/migrations');

interface ColumnComment {
  column: string;
  comment: string;
}

interface TableInfo {
  tableName: string;
  tableComment: string;
  columns: ColumnComment[];
  schemaName: string;
}

/**
 * 解析 Prisma Schema 文件
 */
function parseSchema(schemaContent: string): TableInfo[] {
  const tables: TableInfo[] = [];
  const lines = schemaContent.split('\n');

  let currentTable: TableInfo | null = null;
  let currentComment = '';
  let inModel = false;
  const schemaName = 'aiops'; // 默认 schema

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 提取表注释（/// 开头）
    if (line.startsWith('///')) {
      currentComment = line.substring(3).trim();
      continue;
    }

    // 检测 model 定义
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      inModel = true;
      currentTable = {
        tableName: '',
        tableComment: currentComment,
        columns: [],
        schemaName: schemaName
      };
      currentComment = '';
      continue;
    }

    // 在 model 内部
    if (inModel && currentTable) {
      // 提取字段注释
      if (line.startsWith('///')) {
        currentComment = line.substring(3).trim();
        continue;
      }

      // 提取字段定义
      const fieldMatch = line.match(/^(\w+)\s+/);
      if (fieldMatch && !line.startsWith('//') && !line.startsWith('@@')) {
        const fieldName = fieldMatch[1];

        // 提取 @map 映射的数据库字段名
        const mapMatch = line.match(/@map\("([^"]+)"\)/);
        const dbFieldName = mapMatch ? mapMatch[1] : fieldName;

        if (currentComment) {
          currentTable.columns.push({
            column: dbFieldName,
            comment: currentComment
          });
          currentComment = '';
        }
      }

      // 提取 @@map 映射的数据库表名
      const tableMapMatch = line.match(/@@map\("([^"]+)"\)/);
      if (tableMapMatch) {
        currentTable.tableName = tableMapMatch[1];
      }

      // 提取 @@schema
      const schemaMatch = line.match(/@@schema\("([^"]+)"\)/);
      if (schemaMatch) {
        currentTable.schemaName = schemaMatch[1];
      }

      // model 结束
      if (line === '}') {
        inModel = false;
        if (currentTable.tableName && currentTable.tableComment) {
          tables.push(currentTable);
        }
        currentTable = null;
      }
    }
  }

  return tables;
}

/**
 * 生成 PostgreSQL COMMENT 语句
 */
function generateCommentSQL(tables: TableInfo[]): string {
  const sqlLines: string[] = [];

  sqlLines.push('-- ============================================');
  sqlLines.push('-- 自动生成的数据库注释');
  sqlLines.push('-- 生成时间: ' + new Date().toISOString());
  sqlLines.push('-- ============================================');
  sqlLines.push('');

  for (const table of tables) {
    sqlLines.push('-- ============================================');
    sqlLines.push(`-- ${table.tableComment}`);
    sqlLines.push('-- ============================================');

    // 表注释
    sqlLines.push(`COMMENT ON TABLE ${table.schemaName}.${table.tableName} IS '${table.tableComment}';`);

    // 字段注释
    for (const col of table.columns) {
      sqlLines.push(`COMMENT ON COLUMN ${table.schemaName}.${table.tableName}.${col.column} IS '${col.comment}';`);
    }

    sqlLines.push('');
  }

  return sqlLines.join('\n');
}

/**
 * 主函数
 */
function main() {
  console.log('📖 读取 Prisma Schema...');
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  console.log('🔍 解析 Schema 注释...');
  const tables = parseSchema(schemaContent);

  console.log(`✅ 找到 ${tables.length} 个表的注释`);

  console.log('📝 生成 SQL 语句...');
  const sql = generateCommentSQL(tables);

  // 创建时间戳目录
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '');
  const migrationDir = path.join(OUTPUT_PATH, `${timestamp}_add_database_comments`);

  if (!fs.existsSync(migrationDir)) {
    fs.mkdirSync(migrationDir, { recursive: true });
  }

  const sqlPath = path.join(migrationDir, 'migration.sql');
  fs.writeFileSync(sqlPath, sql);

  console.log(`✅ 注释 SQL 已生成: ${sqlPath}`);
  console.log('\n📌 下一步操作：');
  console.log('   1. 检查生成的 SQL 文件');
  console.log('   2. 运行: pnpm prisma migrate deploy');
}

main();
