package config

import (
	"fmt"
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

// Config 配置结构体
type Config struct {
	ProxyAPISecret string `yaml:"proxy_api_secret"`
	ServerPort     int    `yaml:"server_port"`
}

var (
	instance *Config
	once     sync.Once
)

// LoadConfig 加载配置文件
func LoadConfig() (*Config, error) {
	var err error
	once.Do(func() {
		instance = &Config{}

		// 读取配置文件
		data, readErr := os.ReadFile("config/config.yaml")
		if readErr != nil {
			err = fmt.Errorf("读取配置文件失败: %w", readErr)
			return
		}

		// 解析 YAML
		if parseErr := yaml.Unmarshal(data, instance); parseErr != nil {
			err = fmt.Errorf("解析配置文件失败: %w", parseErr)
			return
		}

		// 设置默认值
		if instance.ServerPort == 0 {
			instance.ServerPort = 8080
		}
	})

	return instance, err
}

// GetConfig 获取配置实例
func GetConfig() *Config {
	return instance
}
