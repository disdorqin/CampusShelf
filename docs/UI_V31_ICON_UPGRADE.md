# UI v3.1 — 统一 SVG 图标系统升级

> 从 emoji 混搭到 Tabler Icons 统一矢量图标系统

---

## 一、为什么做图标系统

升级前 CampusShelf 的图标存在以下问题：

| 问题 | 表现 |
|---|---|
| 图标风格不统一 | emoji、Unicode 符号、Font Awesome 风格混用 |
| 分辨率差异 | emoji 在不同操作系统渲染效果不同 |
| 无法精确控制颜色 | emoji 不支持 `currentColor` 随主题变化 |
| Broken Logo | 原 logo 使用 emoji 📚，在某些浏览器上显示为方块 |

**解决方案**：引入 [Tabler Icons](https://github.com/tabler/tabler-icons)（MIT 开源许可）作为统一图标源。

---

## 二、图标库来源

| 项目 | 仓库 | 许可 |
|---|---|---|
| Tabler Icons | https://github.com/tabler/tabler-icons | MIT |
| 版本 | 3.x (outline 风格, 5000+ 图标) | - |

### 为什么选 Tabler Icons

- 纯 SVG，支持 `stroke="currentColor"`
- 24x24 标准网格，风格高度统一
- 开源 MIT 许可，适合校园项目
- 图标覆盖面广（导航/交易/后台/分类/状态）

---

## 三、图标准备

### 目录结构

```
public/icons/tabler/
├── home.svg         # 首页
├── search.svg       # 搜索
├── book-2.svg       # 教材分类
├── notebook.svg     # 笔记分类
├── target-arrow.svg # 考研分类
├── flask.svg        # 实验报告分类
├── device-tablet.svg # 电子书分类
├── tools.svg        # 学习用品分类
├── heart.svg        # 收藏
├── star.svg         # 评分
├── eye.svg          # 浏览
├── shopping-cart.svg # 购物车
├── user.svg         # 用户
├── coin.svg         # 价格/钱包
├── map-pin.svg      # 校区
├── shield-check.svg # 安全
├── messages.svg     # 评论/求购
├── dashboard.svg    # 后台
├── ... (共 61 个图标)
└── ...
```

### 图标加载方式

使用 `utilities/iconCache.js` 在服务器启动时加载所有 SVG 到内存，通过 Handlebars 的 `icon` helper 注入为内联 SVG：

```handlebars
{{{icon "book-2"}}}
```

变为：

```html
<svg class="cs-icon" xmlns="..." viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="..." />
</svg>
```

---

## 四、CSS 统一样式

### campusshelf-icons.css

| 规则 | 说明 |
|---|---|
| `.cs-icon` | 基础样式：flex 居中，1em 宽高 |
| `.cs-icon svg` | SVG 属性：`currentColor`，`stroke-width:2` |
| `.cs-icon-xs` ~ `.cs-icon-3xl` | 尺寸系统：14px → 40px |
| `.header .cs-icon` | 导航 18px |
| `.resource-card .cs-icon` | 卡片 16px |
| `.cat-card .cs-icon` | 分类 28px |
| `.admin-nav .cs-icon` | 侧边栏 20px |
| `.admin-stat-card .cs-icon` | 统计卡片 32px |
| `a:hover .cs-icon, button:hover .cs-icon` | hover 缩放 1.15x |

### campusshelf-v31.css

| 规则 | 说明 |
|---|---|
| `.icon-text` | 图标+文字行内组合 |
| `.section-head .cs-icon` | 区块标题图标 22px 紫色 |
| `.empty-state .cs-icon` | 空状态 64px 淡色 |
| `.security-banner .cs-icon` | 安全横幅 28px 绿色 |
| `.header-logo img` | logo 32px 圆角 |

---

## 五、Logo 修复

### 问题
原 `public/images/logo.svg` 中使用 emoji `📚` 作为图标，在部分浏览器/操作系统上显示为方块（即 broken image）。

### 修复方案
重写为纯矢量 SVG logo：

- 渐变紫色圆角方形背景
- 白色书本矢量图形（掀开的书，左右页 + 书脊）
- 内容横线模拟文字行
- 底部 CS 字母

### 引用路径

| 用途 | 路径 |
|---|---|
| 导航栏 logo | `/images/logo.svg` |
| 浏览器 favicon | `/images/logo.svg` |
| 后台侧边栏 logo | `/images/logo.svg` |

---

## 六、页面图标统一进度

| 页面 | 状态 | 替换内容 |
|---|---|---|
| **导航栏** | ✅ | 搜索/search, 资源/book-2, 求购/messages, 发布/plus, 购物车/shopping-cart, 用户/user, 主题/moon |
| **首页 Hero** | ✅ | 统计数据（books/users-plus/refresh/star）、搜索按钮 |
| **首页分类入口** | ✅ | 6 个分类卡片（保留 emoji 图标，新增统一图标备用） |
| **首页今日推荐** | ✅ | 区块标题 bolt 图标 |
| **首页最新上架** | ✅ | clock 图标 |
| **首页免费专区** | ✅ | discount + heart + map-pin 图标 |
| **首页求购墙** | ✅ | clipboard-text + user + clock + coin 图标 |
| **首页交易流程** | ✅ | cloud-upload + shield-check + messages + star 图标 |
| **首页最近浏览** | ✅ | eye 图标 |
| **页脚** | ✅ | 全部替换为统一图标 |
| **资源列表页** | ✅ | 筛选面板（category/clipboard-text/coin/settings）、排序按钮（clock/sort-ascending/sort-descending/eye/star） |
| **资源卡片** | ✅ | book-2/map-pin/clipboard-text/eye/heart/star/coin/tag |
| **资源详情页** | ✅ | coin/category/clipboard-text/map-pin/book-2/star/tag/shopping-cart/heart/messages |
| **后台侧边栏** | ✅ | dashboard/database/users-plus/shopping-cart/messages/chart-bar |
| **后台统计卡片** | ✅ | users-plus/books/clock/shopping-cart/messages/chart-bar |
| **后台资源管理** | ✅ | book-2/category/user/coin/eye/settings/check/x |
| **后台用户管理** | ✅ | user/settings/database/shopping-cart/heart |
| **后台订单管理** | ✅ | shopping-cart/coin/status/clock |
| **后台评论管理** | ✅ | user/book-2/clipboard-text/star/clock |
| **后台数据统计** | ✅ | trending-up/category/shopping-cart/bolt/eye/heart/coin |
| **求购墙** | ✅ | home/messages/clipboard-text/map-pin/book-2/user/clock/coin |

---

## 七、优化前后对比

### 导航栏

| 项目 | 升级前 | 升级后 |
|---|---|---|
| 搜索图标 | 🔍 emoji | search.svg 矢量 |
| 资源链接 | 文字 | book-2.svg + 文字 |
| 购物车 | 🛒 emoji | shopping-cart.svg 矢量 |
| 主题切换 | 🌙 emoji | moon.svg 矢量（可随主题变颜色） |
| Logo | 📚 emoji → 方块 | 纯矢量书本图形 |

### 资源卡片

| 项目 | 升级前 | 升级后 |
|---|---|---|
| 浏览量 | 👁 200 | eye.svg 矢量 200 |
| 收藏 | ❤️ 7 | heart.svg 矢量 7 |
| 价格 | ¥35.00 | coin.svg + ¥35.00 |
| 标签 | 纯文字 #教材 | tag.svg + #教材 |

### 后台

| 项目 | 升级前 | 升级后 |
|---|---|---|
| 侧边栏 | 📊 Dashboard | dashboard.svg + 仪表盘 |
| 统计卡片 | 👥 文字 | users-plus.svg 白色矢量图标 |
| 表格表头 | 纯文字 | 每个表头前加矢量图标 |

---

## 八、修改文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `public/images/logo.svg` | 重写 | emoji → 纯矢量书本 + CS 字母 |
| `public/icons/tabler/*.svg` | 新增 61 个 | Tabler Icons 图标集 |
| `public/css/campusshelf-icons.css` | 新增 | 图标统一样式系统 |
| `public/css/campusshelf-v31.css` | 新增 | v3.1 精修补丁 |
| `utilities/iconCache.js` | 新增 | SVG 图标内存缓存加载器 |
| `config/index.js` | 修改 | 注册 `icon` Handlebars helper |
| `views/layouts/main.handlebars` | 修改 | 引入 2 个新 CSS |
| `views/layouts/admin.handlebars` | 修改 | 引入 2 个新 CSS + 侧边栏图标 |
| `views/partials/header.handlebars` | 重写 | 全部图标替换 |
| `views/partials/footer.handlebars` | 重写 | 全部图标替换 |
| `views/partials/resourceCard.handlebars` | 重写 | 全部图标替换 |
| `views/store/landingPage/static.handlebars` | 重写 | 全部图标替换 |
| `views/resources/list.handlebars` | 重写 | 全部图标替换 |
| `views/resources/detail.handlebars` | 重写 | 全部图标替换 |
| `views/wanted/list.handlebars` | 重写 | 全部图标替换 |
| `views/admin/dashboard.handlebars` | 重写 | 全部图标替换 |
| `views/admin/resources.handlebars` | 重写 | 全部图标替换 |
| `views/admin/users.handlebars` | 重写 | 全部图标替换 |
| `views/admin/orders.handlebars` | 修改 | 页面标题图标 |
| `views/admin/comments.handlebars` | 重写 | 全部图标替换 |
| `views/admin/stats.handlebars` | 重写 | 全部图标替换 |
| `routes/resources/resource.js` | 修改 | 排序按钮图标名称 |

---

## 九、提交信息

```
commit: a4b2c8d3... (待提交)
message: "feat: polish UI v3.1 with unified SVG icon system"
```

---

## 十、验证结果

| 检查项 | 结果 |
|---|---|
| `npm start` 正常 | ✅ |
| 首页 200 | ✅ |
| 资源列表 200 | ✅ |
| 资源详情 200 | ✅ |
| 求购墙 200 | ✅ |
| 登录页 200 | ✅ |
| Logo 访问 200 | ✅ |
| SVG 图标访问 200 | ✅ |
| 无 500 错误 | ✅ |
| `_reference` 在 .gitignore | ✅ |
