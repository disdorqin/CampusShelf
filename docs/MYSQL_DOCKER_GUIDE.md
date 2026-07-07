# CampusShelf MySQL + Docker 接入指南

## 为什么从 JSON 升级到 MySQL

| 对比项 | JSON 文件 | MySQL |
|---|---|---|
| 多人协作 | 不同步，覆盖 | 统一数据库 |
| 数据安全 | 文件易丢失 | 容器持久化 |
| 查询效率 | 全量遍历 | 索引查询 |
| 事务支持 | 无 | 完整事务支持 |

## Docker 在项目中的作用

使用 Docker Compose 管理三个容器服务：

| 服务 | 镜像 | 端口 | 用途 |
|---|---|---|---|
| MySQL | `mysql:8.4` | 3306 | 主数据库 |
| Redis | `redis:7` | 6379 | 可选缓存（已启用） |
| Adminer | `adminer` | 8080 | 数据库管理界面 |

## 表结构说明

| 表名 | 说明 | 关键字段 |
|---|---|---|
| `users` | 用户 | email(unique), password_hash, role, campus |
| `resources` | 资源 | category, price, item_condition, status |
| `favorites` | 收藏 | user_id + resource_id (unique) |
| `comments` | 评论 | user_id, resource_id, rating |
| `carts` | 购物车 | user_id |
| `cart_items` | 购物车条目 | cart_id, resource_id, quantity |
| `orders` | 订单 | user_id, total_amount, status |
| `order_items` | 订单条目 | order_id, resource_id, title, price |
| `wanted_posts` | 求购信息 | title, category, budget |

## 如何运行

### 前置条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 已安装并启动
- Node.js (>= 18)

### 首次启动

```bash
# 1. 克隆项目
git clone https://github.com/disdorqin/CampusShelf.git
cd CampusShelf

# 2. 安装依赖
npm install

# 3. 创建本地环境变量（重要：不要提交 .env）
copy .env.example .env
# Windows PowerShell:  Copy-Item .env.example .env

# 4. 编辑 .env，将 DB_PASSWORD 和 MYSQL_PASSWORD 改为你的密码
#    默认示例密码为 change_me，请替换为实际密码

# 5. 启动 Docker 数据库服务
npm run db:start

# 6. 等待 MySQL 就绪后 Seed 数据
npm run db:seed

# 7. 启动项目
npm start

# 8. 访问
#    项目：http://localhost:3000
#    Adminer：http://localhost:8080
```

### 日常运行

```bash
# 启动数据库（如果已停止）
npm run db:start

# 启动项目
npm start
```

### 测试账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 管理员 | admin@campusshelf.com | admin123 |
| 普通用户 | student@campusshelf.com | student123 |

## 如何访问 Adminer

Adminer 是轻量级数据库管理工具：

1. 打开 http://localhost:8080
2. 登录信息：

| 字段 | 值 |
|---|---|
| System | MySQL |
| Server | mysql |
| Username | campusshelf |
| Password | 使用本地 `.env` 中的 `DB_PASSWORD` |
| Database | campusshelf |

## 从宿主机连接 MySQL

使用数据库工具（如 Navicat、DataGrip）：

| 字段 | 值 |
|---|---|
| Host | 127.0.0.1 |
| Port | 3306 |
| User | campusshelf |
| Password | 使用本地 `.env` 中的 `DB_PASSWORD` |
| Database | campusshelf |

## .env 与 .env.example 说明

- **`.env`**：本地真实配置文件，**不要提交到 GitHub**（已在 `.gitignore` 中）
- **`.env.example`**：示例配置模板，可安全提交到 GitHub，密码用 `change_me` 占位

**为什么不能提交 `.env`？**

- `.env` 包含数据库密码等敏感信息
- 多人协作时每个同学用自己的密码
- 提交到 GitHub 后密码会永久暴露在历史记录中

## 切换回 JSON 存储

如需临时切换回 JSON 文件存储：

1. 编辑 `.env`，将 `DB_TYPE=mysql` 改为 `DB_TYPE=json`
2. 重启项目：`npm start`

> JSON 数据文件保留在 `data/` 目录中，不会被删除。

## 常见问题

### Docker 没启动

```bash
docker ps
```

如果返回 `Cannot connect to the Docker daemon`，请手动打开 Docker Desktop，等待左下角显示 "Engine running"。

### 3306 端口被占用

```bash
netstat -ano | findstr :3306
```

找到占用进程的 PID，在任务管理器中结束，或修改 MySQL 端口映射。

### 密码不对

MySQL 官方镜像在已有数据卷时不会重新应用 `MYSQL_ROOT_PASSWORD`。如果密码不正确：

```bash
# 清除数据卷重新创建
npm run db:reset
npm run db:seed
```

### schema 没重新执行

如果修改了 `db/schema.sql`，需要重建容器：

```bash
npm run db:reset
npm run db:seed
```

### 如何重置数据库

**⚠️ 警告：这会删除所有数据！**

```bash
npm run db:reset
npm run db:seed
```

### Node.js 连接 MySQL 失败

错误信息：`MySQL connection failed. Please check Docker MySQL is running.`

检查项：
1. Docker Desktop 是否已启动
2. MySQL 容器是否运行：`docker ps`（应看到 `campusshelf-mysql`）
3. `.env` 中的 `DB_PASSWORD` 是否与 `MYSQL_PASSWORD` 一致
4. 密码中是否包含特殊字符（如 `#`）—— `.env` 中需用引号包裹
