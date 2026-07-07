# CampusShelf 项目计划书（PROJECT_PLAN）

## 1. 项目背景

大学生在校园生活中有大量**二手教材、课程笔记、考研资料、实验报告模板、电子书、学习用品**的
交易与共享需求，但现有交易平台多为综合电商，缺少面向校园场景的垂直入口。
本项目基于开源 Bookstore 二次开发，打造一个轻量、美观、可本地运行的
**校园学习资源交易平台 CampusShelf**，作为学生实践周作品。

## 2. 需求分析

### 用户角色
- **普通学生（买家/卖家）**：浏览、搜索、发布、收藏、评论、下单。
- **管理员**：审核资源、管理用户/订单/评论、查看统计图表。

### 核心需求
1. 资源分类覆盖 6 类校园场景；
2. 完整的「浏览 → 搜索 → 详情 → 收藏/评论 → 发布 → 下单」闭环；
3. 个人中心聚合「我的发布/收藏/订单/最近浏览」；
4. 管理后台可视化运营数据；
5. 性能与部署优化（Redis 缓存、Nginx 反向代理）作为加分项。

## 3. 模块划分

| 模块 | 对应阶段 | 关键文件 |
|------|----------|----------|
| 主题与视觉 | 阶段 1 | `public/css/campusshelf.css`、`views/layouts/*` |
| 资源数据模型 | 阶段 2 | `data/resources/resource.js`、`scripts/seedResources.js` |
| 用户增强 | 阶段 3 | `routes/users/user.js`、`data/comments/comment.js`、`data/orders/order.js` |
| 管理后台 | 阶段 4 | `routes/admin/admin.js`、`views/admin/*` |
| 性能优化 | 阶段 5 | `public/js/campusshelf.js`、`views/partials/resourceCard.handlebars` |
| Redis 缓存 | 阶段 6 | `utilities/cache.js`、`docker-compose.yml` |
| Nginx 部署 | 阶段 7 | `deploy/nginx/campusshelf.conf` |
| 文档与答辩 | 阶段 8/9 | `README.md`、`docs/*` |

## 4. 开发计划（按阶段）

- 阶段 0 基线分析（已完成）
- 阶段 1 主题重命名与视觉改造（已完成）
- 阶段 2 资源数据模型与模块（已完成，36 条 seed）
- 阶段 3 用户功能增强（已完成）
- 阶段 4 管理后台（已完成，Chart.js 图表）
- 阶段 5 前端性能优化（已完成）
- 阶段 6 Redis 缓存（已完成，含降级）
- 阶段 7 Nginx 部署（已完成，含配置）
- 阶段 8 文档与答辩材料（本文件 + README 等）
- 阶段 9 最终自检（见 FINAL_CHECKLIST.md）

## 5. 技术选型说明

- **后端**：Node.js + Express + Handlebars（沿用原项目，降低学习成本）
- **存储**：JSON 文件（`utilities/jsonStore.js`）作为默认，零依赖可运行；
  MongoDB 仅作为可选扩展点（保留连接说明）
- **缓存**：Redis 可选，`utilities/cache.js` 自动降级到内存
- **前端**：原生 JS + Chart.js（CDN），无构建步骤，Windows 直接跑
- **部署**：Nginx 反向代理（可选演示）
