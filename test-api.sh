#!/bin/bash

# 测试脚本：调用 /api/chat-servers/active 接口
# 需要提供一个有效的 JWT token

# 使用方法：./test-api.sh <JWT_TOKEN>
# 示例：./test-api.sh "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

if [ -z "$1" ]; then
  echo "错误：请提供 JWT token"
  echo "使用方法：./test-api.sh <JWT_TOKEN>"
  exit 1
fi

TOKEN="$1"
API_URL="http://localhost:3001/api/chat-servers/active"

echo "======================================"
echo "测试 API: $API_URL"
echo "======================================"
echo ""

echo "发送请求..."
curl -v "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "======================================"
echo "测试完成"
echo "======================================"
