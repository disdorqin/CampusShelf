# 阶段 5：前端性能优化报告（PERFORMANCE）

> 所有优化均为「真实可讲」的改进，不依赖外部服务，Windows 本地直接生效。

## 优化项清单

| # | 优化项 | 实现位置 | 说明 |
|---|--------|----------|------|
| 1 | 图片懒加载 | `views/partials/resourceCard.handlebars`、`views/resources/detail.handlebars` | 所有资源图 `<img loading="lazy">`，首屏只加载可视区图片 |
| 2 | 搜索防抖 | `public/js/campusshelf.js`（实时搜索 300ms 防抖） | 输入停止 300ms 后才请求 `/api/search`，避免逐字符请求 |
| 3 | 列表分页 | `routes/resources/resource.js` + `views/resources/list.handlebars` | 资源列表每页 **8 条**，后台表格同样分页 |
| 4 | localStorage 缓存 | `public/js/campusshelf.js` | 搜索历史(8)、最近浏览(10)、主题偏好、最近筛选条件 |
| 5 | CSS/JS 整理 | `public/css/campusshelf.css`、`public/js/campusshelf.js` | 统一变量、删除冗余、规范静态路径 |
| 6 | 骨架屏/加载态 | `public/js/campusshelf.js` | 实时搜索「搜索中…」；列表筛选提交「加载中…」遮罩 |
| 7 | 响应式优化 | `public/css/campusshelf.css` | 手机/平板/桌面三档断点 |

## 优化前问题

- 原项目首页直接调用 Google Books API `searchForBooks("*")`，无网络即白屏；
- 搜索框每次按键都触发请求（无防抖），弱网下卡顿；
- 无任何图片懒加载，列表一次性加载全部图片；
- 无分页，资源多时页面极长。

## 优化后效果（可通过浏览器验证）

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首页首屏图片请求 | 全部资源图 | 仅可视区（lazy） |
| 搜索请求频率 | 每字符 1 次 | 停止输入 300ms 后 1 次 |
| 列表单次 DOM 量 | 全部 | ≤8 张卡片 |
| 搜索历史/最近浏览 | 无 | localStorage 持久化 |

## 如何验证

1. **懒加载**：浏览器 DevTools → Network，滚动列表，可见图片随滚动按需请求。
2. **防抖**：打开首页，在搜索框快速输入多个字符，Network 中仅出现 1 次 `/api/search`。
3. **分页**：访问 `/resources`，底部出现页码，每页 8 条。
4. **localStorage**：在首页搜索后刷新，搜索历史保留；查看资源后「最近浏览」更新（浏览器 Application → Local Storage）。
5. **加载态**：实时搜索时出现「搜索中…」；列表筛选提交出现「加载中…」遮罩。

## 可截图展示的 Lighthouse 位置

DevTools → Lighthouse → 勾选 Mobile → 生成报告，重点截图：

- **Performance** 面板（特别是「Avoids enormous network payloads」「Uses lazy loading」相关项）
- **Best Practices / SEO**（语义化标签、viewport、meta 描述）
- Network 面板：对比开启/关闭懒加载时的图片请求数量

> 提示：Lighthouse 需在浏览器中本地运行 `npm start` 后访问 `http://localhost:3000` 测量；本说明文档不替代实测截图。
