package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"proxy_server/config"
	"proxy_server/handlers"
	"proxy_server/middleware"
	"syscall"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 设置 Gin 模式
	gin.SetMode(gin.ReleaseMode)

	// 创建 Gin 路由
	router := gin.Default()

	// 应用认证中间件
	router.Use(middleware.AuthMiddleware())

	// 注册路由
	api := router.Group("/api")
	{
		api.POST("/opencode_start", handlers.StartHandler)
		api.POST("/opencode_stop", handlers.StopHandler)
		api.POST("/opencode_delete", handlers.DeleteHandler)
		api.POST("/load_skill", handlers.LoadSkillHandler)
		api.POST("/unload_skill", handlers.UnloadSkillHandler)
	}

	// 启动服务器
	addr := fmt.Sprintf(":%d", cfg.ServerPort)
	log.Printf("服务器启动在端口 %d", cfg.ServerPort)

	// 优雅关闭
	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatalf("服务器启动失败: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("服务器正在关闭...")
}
