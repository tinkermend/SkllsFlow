import { apiClient } from "@/lib/api-client";
import type {
  McpServicesResponse,
  McpServiceDetail,
  McpQueryOptions,
  CreateMcpRequest,
  UpdateMcpRequest,
  HealthCheckResult,
  McpTool,
  McpResource,
} from "../types";

const BASE_URL = "/mcp";

/**
 * 获取我的 MCP 列表
 */
export async function getMyServices(
  options?: McpQueryOptions,
): Promise<McpServicesResponse> {
  const response = await apiClient.get(`${BASE_URL}/my-services`, {
    params: options,
  });
  return response.data;
}

/**
 * 创建 MCP 服务
 */
export async function createService(data: CreateMcpRequest) {
  const response = await apiClient.post(`${BASE_URL}/services`, data);
  return response.data;
}

/**
 * 获取 MCP 服务详情
 */
export async function getServiceDetail(
  mcpId: string,
): Promise<{ data: McpServiceDetail }> {
  const response = await apiClient.get(`${BASE_URL}/services/${mcpId}`);
  return response.data;
}

/**
 * 更新 MCP 服务
 */
export async function updateService(mcpId: string, data: UpdateMcpRequest) {
  const response = await apiClient.put(`${BASE_URL}/services/${mcpId}`, data);
  return response.data;
}

/**
 * 删除 MCP 服务
 */
export async function deleteService(mcpId: string) {
  const response = await apiClient.delete(`${BASE_URL}/services/${mcpId}`);
  return response.data;
}

/**
 * 健康检查
 */
export async function healthCheck(
  mcpId: string,
): Promise<{ data: HealthCheckResult }> {
  const response = await apiClient.post(
    `${BASE_URL}/services/${mcpId}/health-check`,
  );
  return response.data;
}

/**
 * 重启 MCP 服务
 */
export async function restartService(mcpId: string) {
  const response = await apiClient.post(
    `${BASE_URL}/services/${mcpId}/restart`,
  );
  return response.data;
}

/**
 * 获取 MCP 工具列表
 */
export async function getTools(mcpId: string): Promise<{ data: McpTool[] }> {
  const response = await apiClient.get(`${BASE_URL}/services/${mcpId}/tools`);
  return response.data;
}

/**
 * 获取 MCP 资源列表
 */
export async function getResources(
  mcpId: string,
): Promise<{ data: McpResource[] }> {
  const response = await apiClient.get(
    `${BASE_URL}/services/${mcpId}/resources`,
  );
  return response.data;
}

/**
 * 装载 MCP 到会话
 */
export async function loadToSessions(mcpId: string, sessionIds: string[]) {
  const response = await apiClient.post(`${BASE_URL}/services/${mcpId}/load`, {
    sessionIds,
  });
  return response.data;
}

/**
 * 从会话卸载 MCP
 */
export async function unloadFromSessions(mcpId: string, sessionIds: string[]) {
  const response = await apiClient.post(
    `${BASE_URL}/services/${mcpId}/unload`,
    { sessionIds },
  );
  return response.data;
}
