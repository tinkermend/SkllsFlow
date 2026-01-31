import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

// 从环境变量读取 API 基础 URL
// 开发环境：使用相对路径，通过 Vite 代理转发
// 生产环境：使用完整的后端 URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  withCredentials: true, // 携带 httpOnly Refresh Token
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器: 添加 Authorization Header
apiClient.interceptors.request.use(
  (config) => {
    const { auth } = useAuthStore.getState();
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

    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新 Token (Refresh Token 存在 httpOnly Cookie 中)
        const response = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const { accessToken, expiresIn } = response.data;

        useAuthStore.getState().auth.setAccessToken(accessToken, expiresIn);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().auth.reset();
        window.location.href = "/sign-in";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { apiClient };
export default apiClient;
