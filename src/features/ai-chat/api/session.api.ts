import type { Session, CreateSessionParams } from "../types";
import { getOpenCodeClient } from "./client";
import { backendClient, backendApi } from "./backend.api";

export const sessionApi = {
  /**
   * 创建新会话（完整流程）
   * 1. 调用后端 API 准备会话目录（获取 path 并创建用户专属目录）
   * 2. 调用 OpenCode API 创建会话，带上 x-opencode-directory header
   * 3. 调用后端 API 保存到数据库
   */
  create: async (params?: CreateSessionParams & { accountNo: string }): Promise<Session> => {
    if (!params?.accountNo) {
      throw new Error("accountNo 必填，请从用户信息中获取");
    }

    const { accountNo, ...sessionParams } = params;

    // 步骤 1: 调用后端 API 准备会话目录
    // eslint-disable-next-line no-console
    console.log("[sessionApi] 准备会话目录，accountNo:", accountNo);
    let directoryPath: string | undefined;
    try {
      const directoryResult = await backendApi.prepareSessionDirectory(accountNo);
      directoryPath = directoryResult.directory;
      // eslint-disable-next-line no-console
      console.log("[sessionApi] 会话目录准备成功:", directoryResult);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[sessionApi] 准备会话目录失败:", error);
      throw new Error(
        "新建会话失败，请检查后端服务是否正常运行"
      );
    }

    // 步骤 2: 调用 OpenCode API 创建会话，带上 x-opencode-directory header
    const openCodeClient = getOpenCodeClient();
    const openCodeResponse = await openCodeClient.post<{
      id: string;
      title: string;
      project?: string;
      projectID?: string;
      directory?: string;
    }>("/session", {
      title: sessionParams?.title || "New Session",
      ...sessionParams,
    }, {
      headers: {
        "x-opencode-directory": directoryPath,
      },
    });

    const openCodeSession = openCodeResponse.data;
    const projectId = openCodeSession.projectID ?? openCodeSession.project;

    // 步骤 3: 调用后端 API 保存到数据库
    try {
      // eslint-disable-next-line no-console
      console.log("[sessionApi] 保存会话到数据库:", {
        sessionId: openCodeSession.id,
        title: openCodeSession.title,
        projectId,
        directory: directoryPath,
      });

      const backendResponse = await backendClient.post<Session>("/sessions", {
        sessionId: openCodeSession.id,
        title: openCodeSession.title,
        projectId,
        directory: directoryPath,
      });

      // eslint-disable-next-line no-console
      console.log(
        "[sessionApi] 数据库保存成功:",
        backendResponse.data,
      );

      // 返回后端保存的会话数据
      return backendResponse.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[sessionApi] 保存会话到数据库失败:", error);

      // 发生错误时尝试回滚刚创建的 OpenCode 会话，避免前后端状态不一致
      try {
        await openCodeClient.delete(`/session/${openCodeSession.id}`);
      } catch (rollbackError) {
        // eslint-disable-next-line no-console
        console.error(
          "[sessionApi] 回滚 OpenCode 会话失败:",
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
