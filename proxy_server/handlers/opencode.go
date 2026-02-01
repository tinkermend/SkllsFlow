package handlers

import (
	"fmt"
	"net/http"
	"os"
	"proxy_server/models"
	"proxy_server/utils"

	"github.com/gin-gonic/gin"
)

// StartHandler 启动 OpenCode 服务
func StartHandler(c *gin.Context) {
	var req models.StartRequest

	// 解析请求体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	fmt.Printf("StartRequest: %+v\n", req)

	// 验证端口号
	if err := utils.ValidatePort(req.Port); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证目录路径
	if err := utils.ValidateDirPath(req.ChatDir); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 创建目录
	if err := utils.CreateDirectory(req.ChatDir); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "创建目录失败",
		})
		return
	}

	// 启动 OpenCode 服务
	password := ""
	if req.Auth {
		password = req.AuthPassword
	}

	if err := utils.StartOpenCodeService(req.Port, req.ChatDir, req.Auth, password); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "服务启动失败: " + err.Error(),
		})
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "服务启动成功",
	})
}

// StopHandler 停止 OpenCode 服务
func StopHandler(c *gin.Context) {
	var req models.StopRequest

	// 解析请求体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	fmt.Printf("StopRequest: %+v\n", req)

	// 验证端口号
	if err := utils.ValidatePort(req.Port); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 获取进程 PID
	pid, err := utils.GetPIDByPort(req.Port)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "获取进程失败: " + err.Error(),
		})
		return
	}

	// 终止进程
	if err := utils.KillProcess(pid); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "服务停止失败: " + err.Error(),
		})
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "服务停止成功",
	})
}

// DeleteHandler 停止服务并删除目录
func DeleteHandler(c *gin.Context) {
	var req models.DeleteRequest

	// 解析请求体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	fmt.Printf("DeleteRequest: %+v\n", req)

	// 验证端口号
	if err := utils.ValidatePort(req.Port); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 验证目录路径
	if err := utils.ValidateDirPath(req.ChatDir); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	// 获取进程 PID 并停止服务
	pid, err := utils.GetPIDByPort(req.Port)
	if err != nil {
		// 如果进程不存在，继续删除目录
		c.JSON(http.StatusOK, models.Response{
			Code:    200,
			Message: "进程不存在，继续删除目录",
		})
	} else {
		// 终止进程
		if err := utils.KillProcess(pid); err != nil {
			c.JSON(http.StatusInternalServerError, models.Response{
				Code:    500,
				Message: "服务停止失败: " + err.Error(),
			})
			return
		}
	}

	// 删除目录
	if err := os.RemoveAll(req.ChatDir); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "删除目录失败: " + err.Error(),
		})
		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "服务删除成功",
	})
}
