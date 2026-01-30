/**
 * MCP 管理相关类型定义
 */

// MCP 传输类型
export type McpTransportType = 'stdio' | 'sse' | 'websocket';

// MCP 状态
export type McpStatus = 'active' | 'inactive' | 'error' | 'maintenance';

// 健康检查结果
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  latency: number;
  message: string;
  checkedAt?: string;
}

// MCP 服务
export interface McpService {
  id: string;
  mcpId: string;
  name: string;
  description?: string;
  icon?: string;
  version?: string;
  language?: string;
  transportType: McpTransportType;
  status: McpStatus;
  categoryId?: string;
  categoryName?: string;
  tags: string[];
  lastHealthCheckAt?: string;
  healthCheckResult?: HealthCheckResult;
  createdAt: string;
  createdByUser?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

// MCP 市场项目
export interface McpMarketplaceItem {
  id: string;
  mcpId: string;
  name: string;
  description?: string;
  icon?: string;
  categoryName: string;
  tags: string[];
  installationCount: number;
  isVerified: boolean;
  creatorUsername: string;
  createdAt: string;
}

// MCP 工具定义
export interface McpTool {
  id: string;
  toolName: string;
  toolDescription?: string;
  toolSchema: Record<string, any>;
}

// MCP 资源定义
export interface McpResource {
  id: string;
  resourceName: string;
  resourceType: string;
  resourceDescription?: string;
}

// MCP 分类
export interface McpCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  mcpCount?: number;
}

// MCP 标签
export interface McpTag {
  id: string;
  name: string;
  color?: string;
  usageCount?: number;
}

// 分页结果
export interface PaginationResult {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// MCP 服务列表响应
export interface McpServicesResponse {
  data: McpService[];
  pagination: PaginationResult;
}

// MCP 市场列表响应
export interface McpMarketplaceResponse {
  data: McpMarketplaceItem[];
  pagination: PaginationResult;
}

// MCP 服务详情
export interface McpServiceDetail extends McpService {
  connectionConfig?: any;
  envVars?: Record<string, string>;
  tools?: McpTool[];
  resources?: McpResource[];
  activeSessions?: Array<{
    sessionId: string;
    title: string;
    createdAt: string;
  }>;
}

// 查询选项
export interface McpQueryOptions {
  search?: string;
  status?: McpStatus;
  language?: string;
  categoryId?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// 创建 MCP 请求
export interface CreateMcpRequest {
  name: string;
  description?: string;
  icon?: string;
  version?: string;
  language?: string;
  transportType: McpTransportType;
  connectionConfig: any;
  envVars?: Record<string, string>;
  categoryId?: string;
  tags?: string[];
}

// 更新 MCP 请求
export interface UpdateMcpRequest {
  name?: string;
  description?: string;
  icon?: string;
  version?: string;
  language?: string;
  connectionConfig?: any;
  envVars?: Record<string, string>;
  categoryId?: string;
  tags?: string[];
}
