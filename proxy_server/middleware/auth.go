package middleware

import (
	"net/http"
	"proxy_server/config"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware X-Signature 验证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取请求头中的 X-Signature
		signature := c.GetHeader("X-Signature")

		// 获取配置中的密钥
		cfg := config.GetConfig()
		if cfg == nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "服务器配置错误",
			})
			c.Abort()
			return
		}

		// 验证签名
		if signature != cfg.ProxyAPISecret {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "认证失败: X-Signature 无效",
			})
			c.Abort()
			return
		}

		// 验证通过，继续处理请求
		c.Next()
	}
}
