# 阶段 7：Nginx 部署优化（NGINX_DEPLOYMENT）

> Nginx 为**加分项**，用于答辩展示「性能优化 + 部署能力」。基础功能不依赖 Nginx。

## Nginx 在项目中扮演的角色

```
浏览器 ──80──▶ Nginx ──proxy──▶ Node.js (localhost:3000)
                ├─ gzip 压缩
                ├─ 静态资源缓存(7天)
                └─ HTML 不缓存
```

Nginx 作为**反向代理 + 静态加速层**位于 Node 之前，承担：

1. **反向代理**：将 `http://localhost` 的请求转发到 `127.0.0.1:3000` 的 Express 服务；
2. **gzip 压缩**：对 CSS/JS/JSON/SVG 等文本资源压缩，减少传输体积；
3. **静态资源缓存**：图片/JS/CSS 缓存 7 天（`Cache-Control: public, immutable`）；
4. **HTML 不缓存**：保证内容更新即时生效；
5. **（可选）基础限流**：保护 `/api/` 接口。

## 配置文件位置

```
deploy/nginx/campusshelf.conf
```

## 反向代理说明

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Express 通过 `req.headers` 仍可拿到真实客户端 IP（`X-Real-IP`），便于日志/风控。

## gzip 压缩说明

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
```

文本类资源经 gzip 后通常可缩减 60%~80%（如 100KB 的 JS 可压到 ~25KB）。

## 静态资源缓存说明

```nginx
location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

文件名带内容哈希或版本时可用 `immutable`；本项目资源名稳定，7 天缓存足够。
HTML 单独配置 `no-cache`，避免用户看到旧页面。

## Windows 上如何理解和演示

Windows 原生不带 Nginx，答辩演示有两种方式：

1. **WSL（推荐）**：在 WSL 中 `sudo apt install nginx`，把 `campusshelf.conf` 放到
   `/etc/nginx/conf.d/`，`sudo nginx -t && sudo nginx -s reload`；
2. **nginx for Windows**：官网下载 zip，解压后编辑 `conf/nginx.conf` 引入本配置，
   用 `nginx.exe` 启动。

演示步骤：

```bash
# 1) 启动应用
cd D:\PracticeWeek\CampusShelf
npm start

# 2) 启动 Nginx（监听 80）
nginx

# 3) 浏览器访问 http://localhost （由 Nginx 转发到 3000）
```

可对比：直接访问 `:3000` vs 经 Nginx `:80`，用 DevTools Network 观察
`Content-Encoding: gzip` 与静态资源的 `Cache-Control` / `expires` 头。

## 部署结构图

```
                ┌────────────┐
   用户 ───────▶ │   Nginx    │ :80
                │ (gzip+缓存) │
                └─────┬──────┘
                      │ proxy_pass
                ┌─────▼──────┐
                │  Node.js   │ :3000
                │ Express    │
                └─────┬──────┘
                      │ (可选)
                ┌─────▼──────┐
                │   Redis    │ :6379  (缓存，可无)
                └────────────┘
```

## 小结

- Nginx 仅作「加速 + 反向代理」，不动应用代码；
- 不配置 Nginx 时 `npm start` 直接 `:3000` 也能完整使用；
- 答辩时强调：gzip、静态缓存、反向代理三层优化思路。
