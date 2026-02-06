package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
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
	if err == nil {
		// 进程存在，终止进程
		if err := utils.KillProcess(pid); err != nil {
			c.JSON(http.StatusInternalServerError, models.Response{
				Code:    500,
				Message: "服务停止失败: " + err.Error(),
			})
			return
		}
	}
	// 如果进程不存在（err != nil），继续删除目录

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

// LoadSkillHandler 装载技能包
func LoadSkillHandler(c *gin.Context) {
	var req models.LoadSkillRequest

	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	if err := utils.ValidatePort(req.Port); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	if err := utils.ValidateDirPath(req.ChatDir); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: err.Error(),
		})
		return
	}

	if req.SkillFile == nil {
		fileHeader, err := c.FormFile("skill_file")
		if err != nil {
			c.JSON(http.StatusBadRequest, models.Response{
				Code:    400,
				Message: "技能包文件获取失败: " + err.Error(),
			})
			return
		}
		req.SkillFile = fileHeader
	}

	info, err := os.Stat(req.ChatDir)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusBadRequest, models.Response{
				Code:    400,
				Message: "目录不存在: " + req.ChatDir,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "访问目录失败: " + err.Error(),
		})
		return
	}

	if !info.IsDir() {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "chat_dir 必须为目录",
		})
		return
	}

	pid, err := utils.GetPIDByPort(req.Port)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: fmt.Sprintf("未检测到端口 %d 的 opencode 服务进程", req.Port),
		})
		return
	}

	isOpenCode, err := utils.IsOpenCodeProcess(pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "检测进程失败: " + err.Error(),
		})
		return
	}
	if !isOpenCode {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: fmt.Sprintf("未检测到端口 %d 的 opencode 服务进程", req.Port),
		})
		return
	}

	skillsRoot := filepath.Join(req.ChatDir, ".opencode", "skills")
	if err := os.MkdirAll(skillsRoot, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "创建技能目录失败: " + err.Error(),
		})
		return
	}

	tmpZip, err := utils.SaveMultipartToTemp(req.SkillFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "保存技能包失败: " + err.Error(),
		})
		return
	}
	defer os.Remove(tmpZip)

	stagingDir, err := os.MkdirTemp(skillsRoot, ".tmp_upload_")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "创建临时目录失败: " + err.Error(),
		})
		return
	}
	defer os.RemoveAll(stagingDir)

	if err := utils.ExtractZip(tmpZip, stagingDir); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "技能包解压失败: " + err.Error(),
		})
		return
	}

	hasManifest, err := utils.HasSkillManifest(stagingDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "校验技能包失败: " + err.Error(),
		})
		return
	}

	if !hasManifest {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "该技能包存在问题无法正常使用",
		})
		return
	}

	if err := utils.PromoteExtractedSkill(stagingDir, skillsRoot); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "安装技能失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "技能装载成功",
	})
}

// UnloadSkillHandler 卸载技能处理函数
func UnloadSkillHandler(c *gin.Context) {
	var req models.UnloadSkillRequest

	// 解析并验证请求参数
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "请求参数错误: " + err.Error(),
		})
		return
	}

	// 验证端口范围
	if req.Port < 1000 || req.Port > 65535 {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "端口号必须在 1000-65535 之间",
		})
		return
	}

	// 验证 chat_dir 不为空
	if req.ChatDir == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "chat_dir 不能为空",
		})
		return
	}

	// 验证 skill_name 不为空
	if req.SkillName == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "skill_name 不能为空",
		})
		return
	}

	// 检查 OpenCode 服务进程
	pid, err := utils.GetPIDByPort(req.Port)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "服务未启动，请先启动对话服务再执行删除",
		})
		return
	}

	// 验证是否为 OpenCode 进程
	isOpenCode, err := utils.IsOpenCodeProcess(pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "检测进程失败: " + err.Error(),
		})
		return
	}

	if !isOpenCode {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "服务未启动，请先启动对话服务再执行删除",
		})
		return
	}

	// 验证 chat_dir 目录
	info, err := os.Stat(req.ChatDir)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusBadRequest, models.Response{
				Code:    400,
				Message: "目录不存在: " + req.ChatDir,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "检查目录失败: " + err.Error(),
		})
		return
	}

	if !info.IsDir() {
		c.JSON(http.StatusBadRequest, models.Response{
			Code:    400,
			Message: "chat_dir 必须为目录",
		})
		return
	}

	// 构建技能目录路径
	skillPath := filepath.Join(req.ChatDir, ".opencode", "skills", req.SkillName)

	// 检查技能目录是否存在
	if _, err := os.Stat(skillPath); err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusOK, models.Response{
				Code:    200,
				Message: "当前 skill 已经卸载",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "检查技能目录失败: " + err.Error(),
		})
		return
	}

	// 删除技能目录
	if err := os.RemoveAll(skillPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Code:    500,
			Message: "删除技能目录失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Code:    200,
		Message: "技能卸载成功",
	})
}
