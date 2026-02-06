package utils

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

// GetPIDByPort 根据端口号获取进程 PID
func GetPIDByPort(port int) (int, error) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin", "linux":
		// macOS 和 Linux 使用 lsof 命令
		cmd = exec.Command("lsof", "-ti", fmt.Sprintf(":%d", port))
	case "windows":
		// Windows 使用 netstat 命令
		cmd = exec.Command("cmd", "/C", fmt.Sprintf("netstat -ano | findstr :%d", port))
	default:
		return 0, fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("未找到端口 %d 上的进程", port)
	}

	// 解析输出获取 PID
	pidStr := strings.TrimSpace(string(output))
	if pidStr == "" {
		return 0, fmt.Errorf("未找到端口 %d 上的进程", port)
	}

	// Windows 需要额外处理输出格式
	if runtime.GOOS == "windows" {
		lines := strings.Split(pidStr, "\n")
		if len(lines) > 0 {
			fields := strings.Fields(lines[0])
			if len(fields) > 0 {
				pidStr = fields[len(fields)-1]
			}
		}
	}

	pid, err := strconv.Atoi(strings.Split(pidStr, "\n")[0])
	if err != nil {
		return 0, fmt.Errorf("解析 PID 失败: %w", err)
	}

	return pid, nil
}

// KillProcess 根据 PID 终止进程
func KillProcess(pid int) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin", "linux":
		// Unix 系统使用 kill 命令
		cmd = exec.Command("kill", "-9", strconv.Itoa(pid))
	case "windows":
		// Windows 使用 taskkill 命令
		cmd = exec.Command("taskkill", "/F", "/PID", strconv.Itoa(pid))
	default:
		return fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("终止进程失败: %w", err)
	}

	return nil
}

// StartOpenCodeService 启动 OpenCode 服务
func StartOpenCodeService(port int, chatDir string, auth bool, password string) error {
	// 验证目录是否存在
	if _, err := os.Stat(chatDir); os.IsNotExist(err) {
		return fmt.Errorf("目录不存在: %s", chatDir)
	}

	// 构建命令
	var cmd *exec.Cmd
	portStr := strconv.Itoa(port)

	if auth && password != "" {
		// 需要认证时设置密码环境变量
		cmd = exec.Command("opencode", "serve", "--port", portStr)
		cmd.Env = append(os.Environ(), fmt.Sprintf("OPENCODE_SERVER_PASSWORD=%s", password))
	} else {
		// 不需要认证
		cmd = exec.Command("opencode", "serve", "--port", portStr)
	}

	// 设置工作目录
	cmd.Dir = chatDir

	// 启动服务（后台运行）
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("启动服务失败: %w", err)
	}

	return nil
}

// IsOpenCodeProcess 检查进程是否为 OpenCode
func IsOpenCodeProcess(pid int) (bool, error) {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin", "linux":
		cmd = exec.Command("ps", "-p", strconv.Itoa(pid), "-o", "comm=")
	case "windows":
		cmd = exec.Command("wmic", "process", "where", fmt.Sprintf("ProcessId=%d", pid), "get", "CommandLine")
	default:
		return false, fmt.Errorf("不支持的操作系统: %s", runtime.GOOS)
	}

	output, err := cmd.Output()
	if err != nil {
		return false, fmt.Errorf("获取进程信息失败: %w", err)
	}

	scanner := bufio.NewScanner(bytes.NewReader(output))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		if strings.Contains(strings.ToLower(line), "opencode") {
			return true, nil
		}
	}

	if err := scanner.Err(); err != nil {
		return false, fmt.Errorf("解析进程信息失败: %w", err)
	}

	return false, nil
}
