import type { Session, CreateSessionParams } from "../types";
import { getOpenCodeClient } from "./client";
import { backendClient } from "./backend.api";

export const sessionApi = {
  /**
   * 创建新会话（两步流程）
   * 1. 调用 OpenCode API 创建会话
   * 2. 调用 Node.js API 保存到数据库
   */
  create: async (params?: CreateSessionParams): Promise<Session> => {
    // 步骤 1: 调用 OpenCode API 创建会话
    const openCodeClient = getOpenCodeClient();
    const openCodeResponse = await openCodeClient.post<{
      id: string;
      title: string;
      project?: string;
      projectID?: string;
      directory?: string;
    }>("/session", {
      title: params?.title || "New Session",
      ...params,
    });

    const openCodeSession = openCodeResponse.data;
    const projectId = openCodeSession.projectID ?? openCodeSession.project;

    // 步骤 2: 调用 Node.js API 保存到数据库
    try {
      console.log("[sessionApi] Saving to database:", {
        sessionId: openCodeSession.id,
        title: openCodeSession.title,
        projectId,
      });

      const backendResponse = await backendClient.post<Session>("/sessions", {
        sessionId: openCodeSession.id,
        title: openCodeSession.title,
        projectId,
        directory: openCodeSession.directory,
      });

      console.log(
        "[sessionApi] Database save successful:",
        backendResponse.data,
      );

      // 返回后端保存的会话数据
      return backendResponse.data;
    } catch (error) {
      console.error("[sessionApi] Failed to save session to database:", error);

      // 发生错误时尝试回滚刚创建的 OpenCode 会话，避免前后端状态不一致
      try {
        await openCodeClient.delete(`/session/${openCodeSession.id}`);
      } catch (rollbackError) {
        console.error(
          "[sessionApi] Failed to rollback OpenCode session:",
          rollbackError,
        );
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`保存会话到数据库失败，请稍后重试。原因：${message}`);
    }
  },

  /**
   * 获取所有会话（从数据库）
   */
  getAll: async (): Promise<Session[]> => {
    const openCodeClient = getOpenCodeClient();
    const response = await openCodeClient.get<Session[]>("/session");
    return response.data;
  },

  /**
   * 获取单个会话详情
   */
  getById: async (id: string): Promise<Session> => {
    const openCodeClient = getOpenCodeClient();
    const response = await openCodeClient.get<Session>(`/session/${id}`);
    return response.data;
  },

  /**
   * 删除会话
   */
  delete: async (id: string): Promise<boolean> => {
    const openCodeClient = getOpenCodeClient();
    const response = await openCodeClient.delete<boolean>(`/session/${id}`);
    return response.data;
  },

  /**
   * 更新会话（修改标题等）
   */
  update: async (id: string, params: { title?: string }): Promise<Session> => {
    const openCodeClient = getOpenCodeClient();
    const response = await openCodeClient.patch<Session>(
      `/session/${id}`,
      params,
    );
    return response.data;
  },
};
