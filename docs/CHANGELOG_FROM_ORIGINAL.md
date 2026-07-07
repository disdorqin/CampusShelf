# 二次开发对比文档（CHANGELOG_FROM_ORIGINAL）

> 原项目：`julio-lockhart/Bookstore`（2017，MongoDB + Google Books API）
> 新项目：`CampusShelf 校园学习资源交易平台`

## 一、原 Bookstore 有什么

- 用户注册 / 登录（Passport + session）
- 图书搜索（Google Books API）
- 图书详情、购物车、购买记录
- 基于 MongoDB 的数据层
- 经典电商风格页面

## 二、我们保留了什么（未删除核心功能）

- ✅ 认证体系（Passport 本地策略、session、中间件）
- ✅ 购物车 / 购买模型（`shoppingCart` / `purchases`）
- ✅ Handlebars 布局与 partials 结构
- ✅ `routes/index.js` 聚合路由的组织方式
- ✅ 用户注册/登录/登出主流程

## 三、我们新增了什么（体现二次开发痕迹）

1. **校园资源模型**：`data/resources/resource.js`，字段含
   `category/condition/campus/courseName/tags/views/favoritesCount/status` 等，
   覆盖 6 大分类（textbook/notes/exam/report/ebook/supplies）。
2. **资源发布 / 编辑 / 删除 / 审核流**：用户可发布，管理员可审核（pending→approved/rejected/sold）。
3. **收藏夹**：服务端保存 + 一键收藏/取消。
4. **评论与评分**：资源详情页可发表评论、1-5 星评分、平均分。
5. **订单状态增强**：待确认 / 已完成 / 已取消。
6. **个人中心**：我的发布 / 收藏 / 订单 / 最近浏览（tab 切换）。
7. **管理后台**：Dashboard 统计卡片 + Chart.js 图表（分类占比、发布趋势、热门排行、成交趋势）。
8. **实时搜索下拉**（防抖 300ms）+ 搜索历史（localStorage）。
9. **Redis 缓存层**（`utilities/cache.js`）+ 内存降级。
10. **Nginx 部署配置**（`deploy/nginx/campusshelf.conf`）。
11. **统一校园风 UI**：`campusshelf.css`（卡片、圆角、阴影、主色、响应式）。

## 四、我们优化了什么

| 优化 | 原项目问题 | 新方案 |
|------|-----------|--------|
| 存储 | MongoDB 必须本地服务 | JSON 文件层，零依赖可跑 |
| 外部依赖 | Google Books 必联网 | 本地资源为主，API 仅兜底且可降级 |
| 登录阻塞 | reCAPTCHA 需 key | 移除，保留表单 |
| 过旧依赖 | bcrypt-nodejs 废弃 | bcryptjs |
| 性能 | 无懒加载/防抖/分页 | 全部补齐 |
| 安全/可观测 | 无缓存层 | Redis 可选 + 内存降级 |

## 五、二次开发价值

- **场景升级**：从「通用书店」升级为「校园学习资源垂直平台」，更贴近学生真实需求；
- **可运行性**：摆脱 MongoDB / Google API 强依赖，Windows 一键 `npm start` 即可演示；
- **完整性**：前台浏览闭环 + 用户中心 + 管理后台，形成可演示的「产品级」作品；
- **工程素养**：缓存降级、反向代理、性能优化等加分项体现部署与优化思考；
- **文档齐全**：基线报告、性能/Redis/Nginx 专项文档、计划书、功能清单、答辩稿、自检清单。
