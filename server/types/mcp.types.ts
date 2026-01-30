/**
 * MCP 相关类型定义
 */

// MCP 传输类型
export type McpTransportType = 'stdio' | 'sse' | 'websocket';

// MCP 状态
export type McpStatus = 'active' | 'inactive' | 'error' | 'maintenance';

// MCP 连接配置
export interface McpConnectionConfig {
  // stdio 模式
  command?: string;
  args?: string[];
  cwd?: string;

  // sse/websocket 模式
  url?: string;
  headers?: Record<string, string>;
}

// 健康检查结果
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  latency: number;
  message: string;
  checkedAt?: Date;
}

// MCP 服务查询选项
export interface McpServiceQueryOptions {
  search?: string;
  status?: McpStatus;
  language?: string;
  categoryId?: bigint;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// 分页结果
export interface PaginationResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
