import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const AUTH_REFRESH_URL = `${API_BASE_URL}/auth/refresh`;

let refreshTokenPromise: Promise<string> | null = null;

const isAuthRequest = (url?: string) => {
  if (!url) return false;
  return url.includes("/auth/login") || url.includes("/auth/logout") || url.includes("/auth/refresh");
};

const redirectToSignIn = () => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/sign-in") return;
  window.location.href = "/sign-in";
};

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = axios
      .post(
        AUTH_REFRESH_URL,
        {},
        {
          withCredentials: true,
        },
      )
      .then((response) => {
        const accessToken: unknown = response.data?.accessToken;
        const expiresInRaw: unknown = response.data?.expiresIn;
        const expiresIn = typeof expiresInRaw === "number" ? expiresInRaw : Number(expiresInRaw);

        if (!accessToken || typeof accessToken !== "string") {
          throw new Error("Invalid refresh response: accessToken missing");
        }

        if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
          throw new Error("Invalid refresh response: expiresIn missing");
        }

        useAuthStore.getState().auth.setAccessToken(accessToken, expiresIn);

        return accessToken;
      })
      .finally(() => {
        refreshTokenPromise = null;
      });
  }

  return refreshTokenPromise;
};

// 从环境变量读取 API 基础 URL
// 开发环境：使用相对路径，通过 Vite 代理转发
// 生产环境：使用完整的后端 URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 携带 httpOnly Refresh Token
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器: 添加 Authorization Header
apiClient.interceptors.request.use(
  async (config) => {
    const { auth } = useAuthStore.getState();

    if (!isAuthRequest(config.url) && auth.accessToken && auth.accessTokenExpiresAt > 0 && auth.accessTokenExpiresAt <= Date.now()) {
      try {
        const refreshedAccessToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        return config;
      } catch (error) {
        useAuthStore.getState().auth.reset();
        redirectToSignIn();
        return Promise.reject(error);
      }
    }

    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器: 处理 401 和 Token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().auth.reset();
        redirectToSignIn();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
export default apiClient;
