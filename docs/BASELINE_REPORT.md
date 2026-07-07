# 阶段 0：原项目基线分析报告（BASELINE_REPORT）

> 项目：基于 `julio-lockhart/Bookstore` 二次开发升级为 **CampusShelf 校园学习资源交易平台**
> 工作目录：`D:\PracticeWeek\CampusShelf`（分支 `campus-shelf-upgrade`）
> 参考 UI：`_reference/gentelella`（仅借鉴后台布局，不混入主项目）

---

## 1. 原项目技术栈

| 类别 | 内容 |
|------|------|
| 语言 | HTML / CSS / JavaScript（Node.js + Express） |
| 模板引擎 | Handlebars（`express-handlebars`） |
| Web 框架 | Express 4 |
| 认证 | Passport（`passport-local`）+ express-session |
| 数据库 | **MongoDB**（`mongodb` 2.2.33，2017 年） |
| 图书数据 | Google Books API |
| 验证码 | Google reCAPTCHA |
| 其他 | body-parser / morgan / uuid / bcrypt-nodejs（均已过时） |

## 2. 原项目页面结构

```
views/
├── layouts/main.handlebars        # 主布局（含 header/footer 注入）
├── partials/
│   ├── header.handlebars          # 导航栏（登录/注册/购物车）
│   └── footer.handlebars
├── store/landingPage/static.handlebars   # 首页（调用 Google Books "*"）
├── user/loginView/login.handlebars       # 登录（含 reCAPTCHA）
├── user/registrationView/register.handlebars
├── user/accountView/account.handlebars
├── user/accountView/shoppingCart.handlebars
├── user/accountView/purchases.handlebars
└── user/accountView/purchaseConfirmation.handlebars
```

## 3. 原项目已有功能

- ✅ 用户注册（firstName/lastName/email/password）
- ✅ 用户登录（Passport 本地策略 + session）
- ✅ 图书搜索（关键词 → Google Books API）
- ✅ 图书详情（Google Books 返回的 volume）
- ✅ 购物车（增/删/改数量）
- ✅ 历史购买记录（purchases）
- ✅ Google Books API 调用（`searchForBooks`）
- ✅ 数据库连接（MongoDB collections：categories / users）

## 4. 原项目运行方式

```bash
npm install
npm start          # 监听 http://localhost:3000
```

## 5. 当前运行是否成功

**原项目无法直接运行**，原因见下。我们在 Phase 0 即做了最小必要修复，使其可跑通：

- 已本地可运行：✅ `http://localhost:3000` 可打开（首页、注册、登录均 200）

## 6. 依赖是否过旧 / 阻塞点

| 问题 | 影响 | 处理 |
|------|------|------|
| MongoDB 2.x 需本地 `mongod` 服务 | 🚫 阻塞（无服务器则启动即失败） | 改为 **JSON 文件数据层**（`utilities/jsonStore.js`）作为默认后端，MongoDB 仅作可选扩展 |
| Google Books API 需外网 + 关键词域不符 | ⚠️ 阻塞首页/搜索 | 首页/列表改用本地校园资源数据；Google Books 仅在搜索兜底时调用（且可降级） |
| Google reCAPTCHA 需 site key | 🚫 阻塞登录 | 移除 reCAPTCHA，保留登录表单 |
| `bcrypt-nodejs` 已废弃 | ⚠️ 安装/运行风险 | 替换为 `bcryptjs`（纯 JS，免编译） |
| `morgan` 未被 `package.json` 声明 | 🚫 启动即崩溃 | 补回依赖 |
| 部分 2017 依赖在新 Node 不兼容 | ⚠️ | 升级到兼容版本（express 4 / passport 0.6 / uuid 9 等） |

## 7. 可复用模块（保留，未删除）

- 认证体系：`config/authentication/*`（Passport + session）— 保留并修复
- 购物车 / 购买模型：`data/users/user.js` 的 `shoppingCart` / `purchases` — 复用
- Handlebars 布局与 partials 结构 — 复用并美化
- 路由组织方式（`routes/index.js` 聚合）— 复用并扩展

## 8. 需要新增模块

- `utilities/jsonStore.js` — JSON 文件存储（替代 MongoDB）
- `utilities/cache.js` — Redis / 内存缓存（Phase 6）
- `data/resources/resource.js` — 校园资源模型（Phase 2）
- `data/comments/comment.js` — 评论与评分（Phase 3）
- `data/orders/order.js` — 订单（Phase 3）
- `routes/resources/*`、`