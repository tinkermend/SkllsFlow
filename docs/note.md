场景 1: 在不同目录创建会话

# 为项目 A 创建会话
curl -X POST "http://localhost:4096/session?directory=/home/user/project-a" \
  -H "Content-Type: application/json" \
  -d '{"title": "Work on Project A"}'

# 为项目 B 创建会话
curl -X POST "http://localhost:4096/session?directory=/home/user/project-b" \
  -H "Content-Type: application/json" \
  -d '{"title": "Work on Project B"}'

  [
  {
    "id": "ses_405cccef1ffeNG8ZWhyAomZ5Mr",
    "slug": "sunny-mountain",
    "version": "1.1.36",
    "projectID": "global",
    "directory": "/Users/wangpei/src/singe/temp",
    "title": "对话 1",
    "time": {
      "created": 1769429217550,
      "updated": 1769429241461
    },
    "summary": {
      "additions": 0,
      "deletions": 0,
      "files": 0
    }
  }
]