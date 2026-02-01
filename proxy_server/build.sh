#!/bin/bash

# 创建 bin 目录
mkdir -p bin

echo "开始构建多平台可执行文件..."

# Build for macOS (amd64)
echo "构建 macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o bin/proxy_server_darwin_amd64

# Build for macOS (arm64)
echo "构建 macOS (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o bin/proxy_server_darwin_arm64

# Build for Linux (amd64)
echo "构建 Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o bin/proxy_server_linux_amd64

# Build for Linux (arm64)
echo "构建 Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o bin/proxy_server_linux_arm64

# Build for Windows (amd64)
echo "构建 Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o bin/proxy_server_windows_amd64.exe

echo "构建完成！可执行文件位于 bin/ 目录"
ls -lh bin/
