# CampusShelf · 校园学习资源交易平台

> 基于开源项目 [`julio-lockhart/Bookstore`](https://github.com/julio-lockhart/Bookstore) 二次开发升级的
> **学生实践周作品**：面向大学生的二手教材、课程笔记、考研资料、实验报告模板、电子书与学习用品交易/共享平台。

[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

---

## 项目简介

CampusShelf 把「通用书店」升级为「校园学习资源垂直平台」。它保留并复用了原 Bookstore 的
认证与购物车核心，新增了校园资源模型、收藏评论、订单状态、个人中心与管理后台，并补齐了
前端性能优化、Redis 缓存（可选）与 Nginx 部署（可选）等工程化能力。

**最大特点：零外部依赖即可运行** —— 默认使用 JSON 文件存储，无需安装 MongoDB 或配置 Google API。

## 项目特色

- 🎓 **校园场景**：6 大资源分类（教材/笔记/考研/实验报告/电子书/用品）
- 🔍 **完整闭环**：浏览 → 搜索 → 详情 → 收藏/评论 → 发布 → 下单
- 👤 **用户中心**：我的发布 / 收藏 / 订单 / 最近浏览
- 🛠️ **管理后台**：资源审核 + 数据图表（Chart.js）
- ⚡ **性能优化**：图片懒加载、搜索防抖、分页、localStorage 缓存、加载态
- 🧠 **Redis 缓存（可选）**：自动降级内存缓存，绝不阻塞主流程
- 🚀 **Nginx 部署（可选）**：反向代理 + gzip + 静态缓存

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js + Express 4 |
| 模板 | Handlebars（express-handlebars） |
| 认证 | Passport（passport-local）+ express-session |
| 存储 | JSON 文件（`utilities/jsonStore.js`，默认）；MongoDB 可选 |
| 前端 | 原生 JavaScript + Chart.js（CDN） |
| 缓存 | Redis（可选，`utilities/cache.js` 内存降级） |
| 部署 | Nginx 反向代理（可选） |

## 功能模块

详见 [`docs/FEATURES.md`](docs/FEATURES.md)。概览：

- 前台：首页 Hero、资源列表（筛选/搜索/分页）、资源详情（收藏/评论/评分）、资源发布/编辑
- 用户：注册/登录、个人中心、购物车、订单、搜索历史、最近浏览
- 后台：`/admin`  Dashboard、资源管理、用户管理、订单管理、评论管理、数据统计

## 页面截图位置

运行后访问以下地址即可截图（建议顺序见 [`docs/DEFENSE_SCRIPT.md`](docs/DEFENSE_SCRIPT.md)）：

| 页面 | 地址 |
|------|------|
| 首页 | http://localhost:3000/ |
| 资源列表 | http://localhost:3000/resources |
| 资源详情 | http://localhost:3000/resources/`<id>` |
| 发布资源 | http://localhost:3000/resources/publish |
| 个人中心 | http://localhost:3000/user/center |
| 管理后台 | http://localhost:3000/admin |

**管理员测试账号**：`admin@campusshelf.com` / `admin123`
**普通用户测试账号**：`student@campusshelf.com` / `student123`

## 本地运行方式

```bash
# 1. 安装依赖
npm install

# 2. 初始化演示数据（资源、评论、管理员/用户账号）
node scripts/seedResources.js
node scripts/seedUsers.js

# 3. 启动
npm start
# 打开 http://localhost:3000
```

> 依赖最低 Node.js 18+。首次运行建议执行上面的 seed 脚本以生成演示数据。

## Redis 可选优化

```bash
docker compose up -d        # 启动 Redis（端口 6379）
npm start                   # 控制台应显示 [cache] Redis cache enabled
```

不启动 Redis 时控制台显示 `Redis unavailable, using memory cache`，功能不受影响。
详见 [`docs/REDIS_OPTIMIZATION.md`](docs/REDIS_OPTIMIZATION.md)。

## Nginx 可选部署

配置见 [`deploy/nginx/campusshelf.conf`](deploy/nginx/campusshelf.conf)。
先 `npm start` 再启动 Nginx（监听 80 转发到 3000）。详见 [`docs/NGINX_DEPLOYMENT.md`](docs/NGINX_DEPLOYMENT.md)。

## 项目结构

```
CampusShelf/
├── app.js                      # 入口
├── config/                     # Express / 认证 / 中间件
├── routes/                     # store / users / resources / comments / admin / api
├── data/                       # users / resources / comments / orders（JSON 存储）
├── utilities/                  # jsonStore / cache / campusConstants / viewModel
├── views/                      # layouts / partials / store / resources / user / admin
├── public/                     # css / js / img
├── scripts/                    # seedResources.js / seedUsers.js / genImages.js
├── docs/                       # 各阶段文档
├── deploy/nginx/               # Nginx 配置
└── docker-compose.yml          # Redis 服务
```

## 二次开发说明

- 与原项目差异、保留/新增/优化点见 [`docs/CHANGELOG_FROM_ORIGINAL.md`](docs/CHANGELOG_FROM_ORIGINAL.md)
- 基线分析见 [`docs/BASELINE_REPORT.md`](docs/BASELINE_REPORT.md)
- 性能优化见 [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md)
- 项目计划书见 [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)
- 最终自检清单见 [`docs/FINAL_CHECKLIST.md`](docs/FINAL_CHECKLIST.md)

## License

MIT（沿用原 Bookstore 许可精神，仅作教学/实践用途）。
