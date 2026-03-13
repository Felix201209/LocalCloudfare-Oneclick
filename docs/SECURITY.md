# SECURITY（MVP）

## 1. 威胁模型

### 1.1 资产

- 本地业务服务（app）
- 本地管理服务（admin）
- 本地数据库（SQLite）
- Cloudflare Tunnel 凭据
- Cloudflare API Token

### 1.2 入口与边界

1. **业务入口（app hostname）**
   - 公网入口在 Cloudflare
   - 通过 tunnel 转发到本机 app 端口
2. **管理入口（admin hostname）**
   - 公网入口在 Cloudflare
   - 应由 Cloudflare Access 先做身份验证
   - 再转发到本机 admin（localhost）
3. **本地数据库（SQLite）**
   - 仅本机文件，不开放公网端口
4. **Tunnel 层**
   - 由 cloudflared 建立出站连接
   - 不需要路由器端口转发

---

## 2. 身份验证与权限控制责任分层

- **身份验证（Authentication）**：Cloudflare Access 负责（邮箱/IdP/MFA）
- **服务端鉴权（Authorization Gate）**：admin 服务负责校验 Access JWT（当前为骨架）
- **权限控制（RBAC/ABAC）**：本项目 MVP 暂未实现细粒度角色权限，后续补齐

---

## 3. 已做的安全约束

1. admin 默认仅监听 `127.0.0.1`
2. `PUT /config` 只能修改白名单字段：
   - appPort
   - adminPort
   - websocketPort
   - allowedOrigins
   - siteTitle
   - rateLimitPerMinute
3. 所有配置写入前做 Zod 校验
4. 敏感配置变更写审计日志

---

## 4. 故意不实现的能力

1. 不实现远程任意 SQL 执行
2. 不实现远程任意命令执行（RCE）
3. 不开放数据库公网端口
4. 不要求用户做路由器端口转发
5. 不暴露本机内网 IP 到公网
6. 不提供任意文件系统读写 API

这些能力会显著提高被滥用风险，不符合本项目“默认尽量安全”的目标。

---

## 5. 当前 TODO（请勿当作已完成）

1. **Cloudflare Access JWT 完整校验**
   - 当前仅骨架校验（头存在 + aud 字符串占位）
   - TODO：接入 Cloudflare Access JWK，校验签名、iss、aud、exp
2. **速率限制中间件**
   - 当前仅保存阈值配置
   - TODO：在 admin API 实际生效
3. **更细粒度权限模型**
   - TODO：区分只读与配置管理员角色

---

## 6. 推荐部署方式（MVP）

1. 业务服务与 admin 服务都只监听 localhost
2. 所有公网访问都经过 Cloudflare Tunnel
3. admin hostname 必须绑定 Cloudflare Access Policy
4. API Token 用最小权限并定期轮换
5. 将 `~/.localcloudflare` 目录纳入本机备份策略（注意加密）