# 基于golang + gin 实现的代理服务程序

## 项目当前目录

proxy_server

## 项目实现说明

编写一个 基于 go gin框架的 api服务,所有实现的api都需要进行http header X-Signature值验证,api主要实现以下目标:

- 1. /api/opencode_start 启动代理服务
  - 入参: { port": "int类型,启动的端口号", "auth": "bool 类型,是否需要验证","auth_password":"验证密码","chat_dir","服务启动的目录"}
  - 出参: { "code": "int类型,状态码","message": "string类型,提示信息"}

- 2. /api/opencode_stop 停止代理服务
  - 入参: { port": "int类型,对外服务的端口号"}
  - 出参: { "code": "int类型,状态码", "message": "string类型,提示信息"}

- 3. /api/opencode_delete 停止代理服务并删除对应目录
  - 入参: { port": "int类型,对外服务的端口号","chat_dir":"服务启动的目录"}
  - 出参: { "code": "int类型,状态码", "message": "string类型,提示信息"}

- 4. /api/load_skill 装载技能包
  - 入参: multipart/form-data
    - port: int 类型, opencode 服务端口
    - chat_dir: string 类型, opencode 服务目录
    - skill_name: string 类型, 技能唯一名称(建议传 skill_id)
    - skill_file: file 类型, 技能 zip 文件
  - 出参: { "code": "int类型,状态码", "message": "string类型,提示信息"}

- 5. /api/unload_skill 卸载技能包
  - 入参: { "port": "int类型,对外服务的端口号", "chat_dir": "服务启动的目录", "skill_name": "技能名称" }
  - 出参: { "code": "int类型,状态码", "message": "string类型,提示信息"}

**关于认证说明**
先做简单的 X-Signature 值验证, api服务需要定义一个配置文件存储 PROXY_API_SECRET 值,并缓存, 当用户调用api 时候验证 PROXY_API_SECRET 值与请求头中的 X-Signature 值是否一致,如果一致则继续处理,否则返回 401 错误

### opencode_start 接口说明

- 1.只接受 POST 请求 ,非POST请求忽略
- 2.解析入参的值并进行校验: 1. port 参数是否正确,必须在1000-65535 之间 ,2. chat_dir 参数是否正确,必须是目录路径格式
- 3. 校验通过后 先调用操作系统命令 mkdir -p chat_dir 创建对应目录,创建成功继续下一步,创建失败 返回 code=500,message="创建目录失败"
- 4. 判断 auth 是否为false ,如果为false 则忽略 auth_password 参数值, 否则将 auth_password 参数值传递到下一个逻辑
- 5. 如果 auth 为true , 先cd 到 chat_dir 目录,然后通过 OPENCODE_SERVER_PASSWORD=OpenCode@123 opencode serve --port {request 中的port值} 进行启动服务, 启动成功后返回 code=200,message="服务启动成功",否则返回 code=500,message="服务启动失败"

### opencode_stop 接口说明

- 1. 先校验参数值是否正确: 1. port 参数是否正确,必须在1000-65535 之间
- 2. 根据操作系统不同调用不同的命令 获取 对应端口服务的 pid
- 3. 根据获取到的 pid 值,调用操作系统命令停止服务

### opencode_delete 接口说明

- opencode_delete 接口与 opencode_stop 接口唯一的不同是 opencode_delete 还需要根据传过来的 chat_dir 删除对应目录

### load_skill 接口说明

- 1. 仅接受 POST multipart/form-data 请求
- 2. 必填参数: port/chat_dir/skill_name/skill_file
- 3. chat_dir 必须已存在且 port 对应 opencode 进程必须存在
- 4. 技能会解压到固定目录: {chat_dir}/.opencode/skills/{skill_name}
- 5. 若目标目录已存在会先清理旧目录再覆盖安装

### unload_skill 接口说明

- 1. 仅接受 POST JSON 请求
- 2. 必填参数: port/chat_dir/skill_name
- 3. 删除目录: {chat_dir}/.opencode/skills/{skill_name}

### 备注

配置文件中定义:
PROXY_API_SECRET=c3ea4f55ad494aaf2b0a38e0c271e6ec

程序实现完成后请生成不同平台(mac,linux,windows)build 的执行脚本,用于生成执行文件
