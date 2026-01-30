import { DatabaseService } from "./database.service.js";
import { McpTagsRepository } from "../repositories/mcp-tags.repository.js";
import { serializeBigInt } from "../utils/bigint-serializer.js";

/**
 * MCP 标签业务逻辑层
 */
export class McpTagsService {
  private get prisma() {
    return DatabaseService.getInstance();
  }
  private get tagsRepo() {
    return new McpTagsRepository(this.prisma);
  }

  /**
   * 获取标签列表（带使用次数）
   */
  async getTags(search?: string) {
    const tags = await this.tagsRepo.findAllWithUsageCount(search);
    return serializeBigInt(tags);
  }

  /**
   * 创建标签
   */
  async createTag(data: { name: string; color?: string }) {
    // 检查标签是否已存在
    const existing = await this.tagsRepo.findByName(data.name);
    if (existing) {
      throw new Error("标签已存在");
    }

    const tag = await this.tagsRepo.create(data);
    return serializeBigInt(tag);
  }
}
