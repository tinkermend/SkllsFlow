
## 智能对话->新建会话后的会话保存接口实现

- 1.点击新建会话按钮,调用opencode api 接口创建会话后,将接口返回的数据通过 api 保存到数据库 docs/database_design/sessions.sql表中
- 2.当前后端api没有实现数据库连接于调用,请构建通用的数据库相关接口,用于保存会话数据,同时满足后续其他接口于数据库的交互能力
- 3.数据库的连接信息通过.env 文件配置,以下是数据库连接信息: 
`数据库类型`: PostgreSQL
`数据库版本`: 16
`数据库`: aiops
`数据库ip`: 127.0.0.1
`数据库端口`: 5432
`数据库用户名`: aiops
`数据库密码`: AIOps!1234


智能对话 新建会话正确的流程应该是：

客户端调用 http://localhost:4096/session 创建 OpenCode session
客户端获得 OpenCode session 数据（id, title, etc.）
客户端调用 http://localhost:3001/api/sessions 将 opencode 返回的 session 数据保存到数据库 sessions 表,会话表结构见 @docs/database_design/sessions.sql
我们的后端只负责将 session 保存到数据库