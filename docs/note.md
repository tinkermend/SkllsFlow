场景 1: 在不同目录创建会话

# 为项目 A 创建会话
curl -X POST "http://localhost:4096/session?directory=/home/user/project-a" \
  -H "Content-Type: application/json" \
  -d '{"title": "Work on Project A"}'

# 为项目 B 创建会话
curl -X POST "http://localhost:4096/session?directory=/home/user/project-b" \
  -H "Content-Type: application/json" \
  -d '{"title": "Work on Project B"}'