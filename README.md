# CampusShelf · 校园学习资源交易平台

> 基于开源项目 [`julio-lockhart/Bookstore`](https://github.com/julio-lockhart/Bookstore) 二次开发升级的
> **学生实践周作品**：面向大学生的二手教材、课程笔记、考研资料、实验报告模板、电子书与学习用品交易/共享平台。

[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## 项目简介

CampusShelf 把「通用书店」升级为「校园学习资源垂直平台」。它保留并复用了原 Bookstore 的
认证与购物车核心，新增了校园资源模型、收藏评论、订单状态、个人中心与管理后台，并补齐了
前端性能优化、Redis 缓存（可选）与 MySQL 数据库接入等工程化能力。

**支持两种存储模式**：默认使用 **MySQL（Docker）**，可随时通过 `.env` 切换回 JSON 文件。

## 项目特色

- 🎓 **校园场景**：6 大资源分类（教材/笔记/考研/实验报告/电子书/用品）
- 🔍 **完整闭环**：浏览 → 搜索 → 详情 → 收藏/评论 → 发布 → 下单
- 👤 **用户中心**：我的发布 / 收藏 / 订单 / 最近浏览
- 🛠️ **管理后台**：资源审核 + 数据图表（Chart.js）
- ⚡ **性能优化**：图片懒加载、搜索防抖、分页、localStorage 缓存、加载态
- 🧠 **Redis 缓存（可选）**：已内置自动降级
- 🗄️ **MySQL 存储（Docker）**：支持小组共享数据库

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js + Express 4 |
| 模板 | Handlebars（express-handlebars） |
| 认证 | Passport（passport-local）+ express-session |
| 存储 | MySQL 8.4（Docker，默认）\| JSON 文件（备用） |
| 前端 | 原生 JavaScript + Chart.js（CDN）|
| 图标 | Tabler Icons（61 个统一 SVG 图标）|
| 缓存 | Redis（可选，`utilities/cache.js` 内存降级）|
| 部署 | Nginx 反向代理（可选）|

## 功能模块

详见 [`docs/FEATURES.md`](docs/FEATURES.md)。概览：

- 前台：首页 Hero、资源列表（筛选/搜索/分页）、资源详情（收藏/评论/评分）、资源发布/编辑
- 用户：注册/登录、个人中心、购物车、订单、搜索历史、最近浏览
- 后台：`/admin` Dashboard、资源管理、用户管理、订单管理、评论管理、数据统计

## 快速启动（MySQL 模式 — 推荐）

```bash
# 1. 安装依赖
npm install

# 2. 创建本地环境变量
copy .env.example .env
# Windows PowerShell:  Copy-Item .env.example .env
# 编辑 .env，将 DB_PASSWORD 和 MYSQL_PASSWORD 改为本地密码

# 3. 启动 Docker 数据库（MySQL + Redis + Adminer）
npm run db:start

# 4. 初始化演示数据
npm run db:seed

# 5. 启动项目
npm start
# 打开 http://localhost:3000
```

## 快速启动（JSON 模式 — 离线可用）

```bash
# 1. 安装依赖
npm install

# 2. 编辑 .env，设置 DB_TYPE=json

# 3. 初始化演示数据
node scripts/seedResources.js
node scripts/seedUsers.js

# 4. 启动
npm start
```

## 测试账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | admin@campusshelf.com | admin123 |
| 普通用户 | student@campusshelf.com | student123 |

## MySQL 数据库管理

Adminer 管理界面：http://localhost:8080

登录信息详见 [`docs/MYSQL_DOCKER_GUIDE.md`](docs/MYSQL_DOCKER_GUIDE.md)。

## Redis 可选优化

```bash
npm run db:start                # 已包含 Redis
npm start                       # 控制台应显示 [cache] Redis cache enabled
```

不启动 Redis 时控制台显示 `Redis unavailable, using memory cache`，功能不受影响。
详见 [`docs/REDIS_OPTIMIZATION.md`](docs/REDIS_OPTIMIZATION.md)。

## Nginx 可选部署

配置见 [`deploy/nginx/campusshelf.conf`](deploy/nginx/campusshelf.conf)。
先 `npm start` 再启动 Nginx（监听 80 转发到 3000）。详见 [`docs/NGINX_DEPLOYMENT.md`](docs/NGINX_DEPLOYMENT.md)。

## 页面截图位置

| 页面 | 地址 |
|------|------|
| 首页 | http://localhost:3000/ |
| 资源列表 | http://localhost:3000/resources |
| 资源详情 | http://localhost:3000/resources/`<id>` |
| 发布资源 | http://localhost:3000/resources/publish |
| 个人中心 | http://localhost:3000/user/center |
| 管理后台 | http://localhost:3000/admin |
| 数据库管理 | http://localhost:8080 |

## 项目结构

```
CampusShelf/
├── app.js                      # 入口
├── config/                     # Express / 认证 / 中间件
├── routes/                     # store / users / resources / comments / admin / api
├── data/                       # JSON 存储 + MySQL 适配器
├── models/                     # MySQL 模型（备用）
├── db/                         # schema.sql
├── utilities/                  # jsonStore / db / cache / iconCache / viewModel
├── views/                      # layouts / partials / store / resources / user / admin
├── public/                     # css / js / img / icons
├── scripts/                    # seedResources.js / seed-mysql.js
├── docs/                       # 各阶段文档
├── deploy/nginx/               # Nginx 配置
└── docker-compose.yml          # MySQL + Redis + Adminer 服务
```

## 关键文档

| 文档 | 说明 |
|------|------|
| [`docs/UI_UPGRADE_REPORT.md`](docs/UI_UPGRADE_REPORT.md) | UI v3 升级报告 |
| [`docs/UI_V31_ICON_UPGRADE.md`](docs/UI_V31_ICON_UPGRADE.md) | 图标系统升级报告 |
| [`docs/MYSQL_DOCKER_GUIDE.md`](docs/MYSQL_DOCKER_GUIDE.md) | MySQL + Docker 接入指南 |
| [`docs/CHANGELOG_FROM_ORIGINAL.md`](docs/CHANGELOG_FROM_ORIGINAL.md) | 与原项目差异说明 |
| [`docs/FINAL_CHECKLIST.md`](docs/FINAL_CHECKLIST.md) | 最终自检清单 |

## License

MIT（沿用原 Bookstore 许可精神，仅作教学/实践用途）。
