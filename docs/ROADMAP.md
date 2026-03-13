# ROADMAP

## v0.2（近期）

- Windows 一键安装包（MSI / winget-friendly）
- init 向导增强：
  - 更明确的权限检查
  - hostname 冲突自动重试
- admin API 增加速率限制中间件
- Access JWT 完整签名校验

## v0.3

- 自动更新机制（CLI 自更新 / 通知）
- cloudflared 服务状态自动检查与修复建议
- 多服务注册（不仅 app/admin）
- 配置加密与密钥轮换策略

## v0.4

- HTTPS / 域名增强配置模板
- Access 应用策略自动化引导（文档 + 半自动）
- 观察性增强（结构化日志 + 健康诊断输出）

## v0.5+

- GUI 管理界面（本地桌面/Web，仅本机访问）
- 更完整权限模型（角色、审计报表）
- 多实例/多项目管理
- 插件化服务发现（Node/Python/Go 项目快速接入）