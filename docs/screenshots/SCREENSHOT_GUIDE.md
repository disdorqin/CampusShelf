# Screenshot Guide — CampusShelf

> 以下截图建议用于答辩/演示。每张图标注了页面地址和应展示的亮点。

## 截图清单

| # | 截图名称 | 页面地址 | 展示亮点 |
|---|---|---|---|
| 1 | `01-home.png` | http://localhost:3000/ | Hero 大标题 + 搜索框 + 热词 + 4 格统计数据动效 + 分类入口 6 卡片 |
| 2 | `02-resources-filter.png` | http://localhost:3000/resources | 左侧筛选面板（分类/成色/价格/免费）+ 排序按钮 + 条件 chips + 资源卡片网格 |
| 3 | `03-resource-detail.png` | http://localhost:3000/resources/{id} | 三栏布局（图/信息/卖家卡片）+ 统一 SVG 图标 + 安全交易提示 |
| 4 | `04-wanted-wall.png` | http://localhost:3000/wanted | 求购卡片列表 + 预算 + 统一图标 |
| 5 | `05-publish-resource.png` | http://localhost:3000/resources/publish | 发布表单（需登录） |
| 6 | `06-user-center.png` | http://localhost:3000/user/center | 个人中心（我的发布/收藏/订单）（需登录） |
| 7 | `07-admin-dashboard.png` | http://localhost:3000/admin | 渐变统计卡片 + 图表 + 热门排行表格（需 admin 登录） |
| 8 | `08-admin-resource-review.png` | http://localhost:3000/admin/resources | 资源审核列表 + 状态圆点 + 通过/拒绝按钮 |
| 9 | `09-adminer-mysql-tables.png` | http://localhost:8080 | Adminer 数据库管理界面，显示 campusshelf 数据库 9 张表 |
| 10 | `10-readme-run-guide.png` | GitHub 仓库页面 | README 中的快速启动步骤截图 |

## 截图操作指南

### 准备工作
```bash
# 确保项目运行
npm start
# 打开浏览器
http://localhost:3000
```

### 截图 #1 — 首页
1. 访问 http://localhost:3000/
2. 截图范围：全屏（包含 Hero、分类入口、推荐资源区）
3. 亮点：渐变 Hero、搜索框、统计数据动画

### 截图 #2 — 资源列表 + 筛选
1. 访问 http://localhost:3000/resources
2. 选择某个分类（如「二手教材」）
3. 截图范围：左侧筛选面板 + 右侧结果网格 + 条件 chips
4. 亮点：左侧筛选项（带图标）、排序按钮、chips

### 截图 #3 — 资源详情
1. 访问 http://localhost:3000/resources/
2. 点击任意一个资源进入详情
3. 截图范围：三栏布局
4. 亮点：左侧封面、中间信息（统一图标）、右侧卖家卡片

### 截图 #4 — 求购墙
1. 访问 http://localhost:3000/wanted
2. 截图范围：求购卡片列表
3. 亮点：卡片左侧彩色边框、统一图标

### 截图 #5 — 发布资源（选做，需登录）
1. 用 student@campusshelf.com / student123 登录
2. 访问 http://localhost:3000/resources/publish
3. 截图范围：发布表单

### 截图 #6 — 个人中心（选做，需登录）
1. 登录后访问 http://localhost:3000/user/center
2. 截图范围：个人中心页面

### 截图 #7 — 后台 Dashboard
1. 用 admin@campusshelf.com / admin123 登录
2. 访问 http://localhost:3000/admin
3. 截图范围：统计卡片 + 图表 + 热门资源排行
4. 亮点：渐变卡片、图表实时数据

### 截图 #8 — 资源审核
1. 登录 admin
2. 访问 http://localhost:3000/admin/resources
3. 筛选「pending」状态
4. 截图范围：审核表格 + 通过/拒绝按钮
5. 亮点：status 圆点状态标签、btn-action 按钮

### 截图 #9 — Adminer 数据库
1. 访问 http://localhost:8080
2. 登录：System=MySQL / Server=mysql / Username=campusshelf / Password=DB_PASSWORD
3. 选择 campusshelf 数据库
4. 截图范围：显示 9 张表的列表

### 截图 #10 — README 运行指南
1. 打开 https://github.com/disdorqin/CampusShelf
2. 滚动到「快速启动」部分
3. 截图范围：README 中的 Docker+MySQL 启动步骤

## 推荐截图工具
- 浏览器 DevTools 截图（F12 → Ctrl+Shift+P → "screenshot"）
- Windows Snip & Sketch（Win+Shift+S）
- [FireShot 浏览器扩展](https://getfireshot.com/)

---
## 截图文件命名规范

截图完成后，请将图片文件放在 docs/screenshots/ 目录下：

docs/screenshots/
├── 01-home.png
├── 02-resources-filter.png
├── 03-resource-detail.png
├── 04-wanted-wall.png
├── 05-publish-resource.png
├── 06-user-center.png
├── 07-admin-dashboard.png
├── 08-admin-resource-review.png
├── 09-adminer-mysql-tables.png
├── 10-readme-run-guide.png
└── SCREENSHOT_GUIDE.md
