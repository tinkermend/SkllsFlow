package models

// StartRequest 启动服务请求
type StartRequest struct {
	Port         int    `json:"port" binding:"required,min=1000,max=65535"`
	Auth         bool   `json:"auth"`
	AuthPassword string `json:"auth_password"`
	ChatDir      string `json:"chat_dir" binding:"required"`
}

// StopRequest 停止服务请求
type StopRequest struct {
	Port int `json:"port" binding:"required,min=1000,max=65535"`
}

// DeleteRequest 删除服务请求
type DeleteRequest struct {
	Port    int    `json:"port" binding:"required,min=1000,max=65535"`
	ChatDir string `json:"chat_dir" binding:"required"`
}

// Response 统一响应结构
type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}
