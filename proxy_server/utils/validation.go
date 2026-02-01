package utils

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// ValidatePort 验证端口号是否在有效范围内
func ValidatePort(port int) error {
	if port < 1000 || port > 65535 {
		return fmt.Errorf("端口号必须在 1000-65535 之间")
	}
	return nil
}

// ValidateDirPath 验证目录路径格式
func ValidateDirPath(path string) error {
	if path == "" {
		return fmt.Errorf("目录路径不能为空")
	}

	// 清理路径
	cleanPath := filepath.Clean(path)
	if cleanPath == "." || cleanPath == ".." {
		return fmt.Errorf("无效的目录路径")
	}

	return nil
}

// CreateDirectory 创建目录
func CreateDirectory(path string) error {
	// 使用 mkdir -p 命令创建目录
	cmd := exec.Command("mkdir", "-p", path)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("创建目录失败: %w", err)
	}

	// 验证目录是否创建成功
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("目录创建失败: %s", path)
	}

	return nil
}
