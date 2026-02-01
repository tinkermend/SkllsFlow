.PHONY: build build-all clean run test

# 默认目标：构建当前平台
build:
	@echo "构建当前平台..."
	@go build -o bin/proxy_server

# 构建所有平台
build-all:
	@echo "构建所有平台..."
	@chmod +x build.sh
	@./build.sh

# 清理构建文件
clean:
	@echo "清理构建文件..."
	@rm -rf bin/

# 运行服务器
run:
	@echo "启动服务器..."
	@go run main.go

# 运行测试
test:
	@echo "运行测试..."
	@go test -v ./...

# 格式化代码
fmt:
	@echo "格式化代码..."
	@go fmt ./...

# 代码检查
vet:
	@echo "代码检查..."
	@go vet ./...
