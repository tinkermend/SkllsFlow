@echo off
REM 创建 bin 目录
if not exist bin mkdir bin

echo 开始构建多平台可执行文件...

REM Build for Windows (amd64)
echo 构建 Windows (amd64)...
set GOOS=windows
set GOARCH=amd64
go build -o bin\proxy_server_windows_amd64.exe

REM Build for Linux (amd64)
echo 构建 Linux (amd64)...
set GOOS=linux
set GOARCH=amd64
go build -o bin\proxy_server_linux_amd64

REM Build for Linux (arm64)
echo 构建 Linux (arm64)...
set GOOS=linux
set GOARCH=arm64
go build -o bin\proxy_server_linux_arm64

REM Build for macOS (amd64)
echo 构建 macOS (amd64)...
set GOOS=darwin
set GOARCH=amd64
go build -o bin\proxy_server_darwin_amd64

REM Build for macOS (arm64)
echo 构建 macOS (arm64)...
set GOOS=darwin
set GOARCH=arm64
go build -o bin\proxy_server_darwin_arm64

echo 构建完成！可执行文件位于 bin\ 目录
dir bin\
