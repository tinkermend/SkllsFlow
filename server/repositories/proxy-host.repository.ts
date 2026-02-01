import { type PrismaClient, type ProxyHost, type Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

/**
 * ProxyHost Repository
 * 处理代理主机的数据库操作
 * 扩展 BaseRepository 以利用通用 CRUD 操作
 */
export class ProxyHostRepository extends BaseRepository<
  ProxyHost,
  Prisma.ProxyHostCreateInput,
  Prisma.ProxyHostUpdateInput,
  Prisma.ProxyHostWhereInput,
  Prisma.ProxyHostOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected get modelName(): string {
    return 'proxyHost';
  }

  /**
   * 查询最早更新的活跃代理主机
   * 用于负载均衡，选择最久未使用的代理主机
   *
   * @returns 最早更新的活跃代理主机，如果没有则返回 null
   *
   * @example
   * ```typescript
   * const proxyHost = await repository.findOldestActive();
   * if (proxyHost) {
   *   console.log('Selected proxy:', proxyHost.host);
   * }
   * ```
   */
  async findOldestActive(): Promise<ProxyHost | null> {
    return this.prisma.proxyHost.findFirst({
      where: {
        status: 'active',
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });
  }

  /**
   * 查询所有活跃的代理主机
   *
   * @returns 所有活跃的代理主机列表
   *
   * @example
   * ```typescript
   * const activeHosts = await repository.findAllActive();
   * console.log(`Found ${activeHosts.length} active proxy hosts`);
   * ```
   */
  async findAllActive(): Promise<ProxyHost[]> {
    return this.findAll({
      where: {
        status: 'active',
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });
  }
}
