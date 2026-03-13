# LocalCloudflare Oneclick (MVP)

> 仓库名保留 `LocalCloudfare-Oneclick`，但产品文档统一使用 **Cloudflare** 拼写。  
> 目标：让 Windows / PC 用户可以用一个 CLI 向导，把本机服务通过 Cloudflare Tunnel 安全暴露到公网。

## 1. 这个项目做什么？

LocalCloudflare Oneclick 提供一个可运行的 MVP：

- `localcloudflare doctor`：检查本机依赖（Node.js / cloudflared / Git）
- `localcloudflare init`：交互式配置向导（Cloudflare Token、zone、hostname、tunnel）
- `localcloudflare start`：启动本地 admin 服务（只监听 `127.0.0.1`）并输出 cloudflared 启动提示
- `localcloudflare status`：查看配置摘要（zone / tunnel / hostnames / access 状态）

并生成：

- 本地配置文件：`~/.localcloudflare/config.json`
- `.env`：`~/.localcloudflare/.env`
- cloudflared 配置：`~/.localcloudflare/generated/cloudflared-config.yml`
- Windows 服务安装脚本：`~/.localcloudflare/generated/install-cloudflared-service.ps1`

---

## 2. Windows 一键安装包（推荐）

### 2.1 获取 `LocalCloudflare-Setup.exe`

- 方式 A：在 GitHub Actions 的 `build-windows-installer` 工作流下载构建产物
- 方式 B：在 Release（后续）下载已签名安装包

### 2.2 双击安装后会自动做什么

1. 安装程序复制 CLI 文件到 `C:\Program Files\LocalCloudflare`
2. 自动检查并安装依赖（优先 `winget`）：
   - Node.js LTS
   - cloudflared
3. 自动执行 `npm install --omit=dev` + `npm run build`
4. 创建开始菜单入口：
   - 初始化向导
   - 启动服务
   - 状态检查
   - 环境检测

> 首次安装需联网，可能持续几分钟。

## 3. 源码安装（开发者）

### 3.1 先决条件（Windows 推荐）

```powershell
winget install OpenJS.NodeJS.LTS
winget install Cloudflare.cloudflared
winget install Git.Git
```

### 3.2 获取并安装依赖

```bash
git clone https://github.com/Felix201209/LocalCloudfare-Oneclick.git
cd LocalCloudfare-Oneclick
npm install
npm run build
```

本地开发模式：

```bash
npm run dev -- doctor
```

---

## 4. 如何运行 CLI 向导

### 3.1 环境检查

```bash
npm run dev -- doctor
# 或构建后
node dist/index.js doctor
```

### 3.2 初始化（重点）

```bash
npm run dev -- init
```

向导会引导你：

1. 输入 Cloudflare API Token
2. 选择账户下可用的 zone/domain
3. 输入 `app.example.com` / `admin.example.com`
4. 处理 tunnel 创建或复用
5. 自动写入本地配置与 cloudflared 配置

### 3.3 启动本地 admin 服务

```bash
npm run dev -- start
```

服务默认仅监听：

- `http://127.0.0.1:<adminPort>`

### 3.4 查看状态

```bash
npm run dev -- status
```

---

## 5. Cloudflare API Token 配置

MVP 使用环境变量读取 Token（默认变量名 `CLOUDFLARE_API_TOKEN`）。

`init` 阶段会写入：

- `~/.localcloudflare/.env`

示例：

```env
CLOUDFLARE_API_TOKEN=xxxxx
CF_ACCESS_AUD=
```

建议 Token 仅授予最小权限：

- Zone DNS 编辑
- Tunnel 读取/创建所需权限

---

## 6. 如何启动 cloudflared

`init` 完成后会生成配置文件：

- `~/.localcloudflare/generated/cloudflared-config.yml`

运行示例：

```powershell
cloudflared tunnel login
cloudflared tunnel --config "$env:USERPROFILE/.localcloudflare/generated/cloudflared-config.yml" run <tunnel-name>
```

Windows 服务脚本（管理员 PowerShell）：

```powershell
$env:USERPROFILE/.localcloudflare/generated/install-cloudflared-service.ps1
```

---

## 7. 如何验证 app/admin 可访问

1. 本机先验证 admin：
   - `http://127.0.0.1:<adminPort>/health`
2. cloudflared 启动后，访问：
   - `https://app.example.com`
   - `https://admin.example.com`
3. `admin.example.com` 应配 Cloudflare Access Policy（强烈建议默认强制）

---

## 8. 安全边界与限制（MVP）

### 已实现的安全方向

- admin 服务只监听 `127.0.0.1`（不直接公网开放）
- tunnel ingress 显式绑定 app/admin hostname
- 配置修改仅允许白名单字段（Zod schema 强校验）
- 审计日志记录配置变更事件（`~/.localcloudflare/audit.log`）
- 预留 Cloudflare Access JWT 中间件骨架

### 明确不做（故意）

- ❌ 任意 SQL 执行
- ❌ 任意 shell 命令执行
- ❌ 暴露数据库端口到公网
- ❌ 暴露 SSH 到公网
- ❌ 任意文件系统读写 API

### 当前仍是骨架 / TODO

- Access JWT 完整签名校验（当前仅做头存在 + aud 字符串骨架校验）
- 更完整的 Windows 服务状态检测与自动恢复
- Tunnel route 规则的更细粒度冲突处理

---

## 9. MVP 目录结构

```text
src/
  cli/
  wizard/
  cloudflare/
  admin/
  config/
  security/
docs/
  SECURITY.md
  ROADMAP.md
```

---

## 10. 免责声明

这是一个可跑通主路径的 MVP，用于快速验证“本地托管 + Cloudflare Tunnel + 受控 admin”模式。生产部署前请阅读 `docs/SECURITY.md` 并补齐 TODO。