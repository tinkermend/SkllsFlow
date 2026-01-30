import { DatabaseService } from "./database.service.js";
import { McpCategoriesRepository } from "../repositories/mcp-categories.repository.js";
import { serializeBigInt } from "../utils/bigint-serializer.js";

/**
 * MCP 分类业务逻辑层
 */
export class McpCategoriesService {
  private get prisma() {
    return DatabaseService.getInstance();
  }
  private get categoriesRepo() {
    return new McpCategoriesRepository(this.prisma);
  }

  /**
   * 获取所有分类（带 MCP 数量）
   */
  async getAllCategories() {
    const categories = await this.categoriesRepo.findAllActiveWithCount();
    return serializeBigInt(categories);
  }
}
