

- [x] `fix:` 智能对话,thinks 过程没有在对话页面输出出来,opencode api请参考 @docs/openapi.json 实现将思考过程也显示在对话页面,并默认自动折叠,prompt-kit提供了reasoning组件
- [ ] `fix:` 默认 opencode serve 启动路径定义, opencode 默认启动路径为: /Users/wangpei/src/singe/ai_ops/shadcn-admin/user_session/{登录用户名称}, 如果没有登录用户名称的目录则自动创建
- [x] `feat:` 智能对话 对话列表只显示最近的10个session,当前因为会话过多导致新建会话按钮被淹没了
- [x] `feat:` 基于 opencode api @docs/openapi.json 实现会话的删除,会话名称修改, 会话名称修改接口为: PATCH	/session/:id, 会话的删除接口为: DELETE	/session/:id
- [x] `feat:` 实现对话调用的中止功能,参见opencode api @docs/openapi.json 中的  /session/:id/abort
- [x] `fix:` 调用 opencode /command 接口返回的description 内容在智能对话页面只显示前80个字符,剩下以...表示
- [x] `fix:` 优化输入 / 显示的 command 窗口布局,首先窗口位置不是靠近最左侧,而是与输入框对齐, 其次窗口的最大宽度也与输入框宽度一致
- [x] `fix:` 优化智能对话中的 对话显示布局,使其靠近最左侧与菜单栏贴合,而不是在菜单页面和对话页面中间留了大片空白

- [x] `delete:` 删除对于本项目无用的菜单以及移除相关代码,主要删除如下内容:
    - 删除Clert 认证菜单以及关联的下级 "登录","注册","用户管理" 页面
    - 删除 "认证" 菜单下面的 "OTP 验证"
    - 删除 "认证" 菜单下面的 "登录" 页面, 但不要删除 "登录(双栏)"页面
    - 删除 "认证" 菜单下面的  "忘记密码" 页面
    - 删除主菜单定义的 "常用", "页面", "其他"



- [x] `feat:` 将"应用" 菜单名称改为 "技能管理"
- [ ] `feat:` 在主菜单上新增 "MCP管理","Agent管理" 菜单, 两项放在 "智能对话" 下方,页面功能暂时不开发,只做一个占位,后续再开发相应页面具体功能实现
- [ ] `change:` 点击"退出登录"返回登录页面
- [ ] `change:` 点击"退出登录"返回登录页面


- 6.后端api 尚未实现将 创建的opencode进行存储管理