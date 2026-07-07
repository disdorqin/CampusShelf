# 阶段 6：Redis 缓存优化（REDIS_OPTIMIZATION）

> Redis 为**加分优化项**。**不启动 Redis 时项目照常运行**，自动降级为内存缓存。

## 为什么使用 Redis

校园资源平台存在「读多写少」的场景：热门资源、搜索结果、排行榜被频繁访问。
引入缓存可：

- 降低重复计算 / 重复文件读取；
- 在多人访问时共享热点数据（内存缓存仅进程内，Redis 可跨进程/跨实例）；
- 为后续水平扩展（多 Node 实例）预留能力。

## 接入方式

统一缓存入口：`utilities/cache.js`

```js
const cache = require('./utilities/cache');
await cache.set('key', value, ttlSeconds);
const v = await cache.get('key');      // miss 返回 null
await cache.del('key');
await cache.incr('key');               // 浏览量计数
cache.getMode();                       // 'redis' | 'memory'
```

启动时探测 Redis 可用性，控制台输出当前模式：

```
[cache] Redis cache enabled
# 或
[cache] Redis unavailable, using memory cache
```

## 缓存 Key 设计与 TTL

| 场景 | Key | TTL | 说明 |
|------|-----|-----|------|
| 首页热门资源 | `campusshelf:hot-resources` | 300s | 热门/最新资源列表 |
| 搜索结果 | `campusshelf:search:<keyword>` | 180s | 按关键词缓存 |
| Google Books API | `campusshelf:google:<query>` | 3600s | 外部 API 结果缓存 |
| 资源浏览量 | `campusshelf:views:<resourceId>` | — | 计数器（incr） |
| 热门排行榜 | `campusshelf:ranking` | 300s | 按浏览量/收藏排序 |

写入点示例：

- 首页 `/`（store/search.js）读取热门资源时走 `campusshelf:hot-resources`；
- 资源审核通过/下架时 `cache.del('campusshelf:hot-resources')` 失效缓存；
- `/api/search` 命中 `campusshelf:search:<kw>`。

## Redis 不可用时的降级方案

`utilities/cache.js` 内部维护一个 `Map` 内存缓存：

- 启动时 `redis.createClient()` 尝试连接；
- 连接失败 / `redis` 未安装 / `REDIS_URL` 未配置 → 捕获错误，标记 `mode='memory'`；
- 所有 `get/set/del/incr` 在内存模式下直接操作 `Map`，接口完全一致；
- 因此**业务代码无需感知**后端差异，调用方式不变。

## 如何启动 Redis

### 方式一：Docker（推荐，已提供 docker-compose.yml）

```bash
docker compose up -d      # 启动 redis:7，端口 6379
npm start                 # 控制台应显示 [cache] Redis cache enabled
```

### 方式二：本地安装 Redis

- Windows：使用 WSL 安装 `redis-server`，或下载 Memurai / Redis for Windows；
- macOS：`brew install redis && brew services start redis`；
- 启动后默认 `127.0.0.1:6379`。

也可用环境变量指定：`set REDIS_URL=redis://127.0.0.1:6379`（可选）。

## 如何验证缓存命中

1. 启动 Redis 后运行 `npm start`，确认控制台输出 `Redis cache enabled`。
2. 访问首页 `/` 一次（写入 `campusshelf:hot-resources`）。
3. 另开终端：

   ```bash
   redis-cli
   > KEYS campusshelf:*
   > GET "campusshelf:hot-resources"      # 可见 JSON 字符串
   > INCR campusshelf:views:<id>           # 模拟浏览量自增
   ```

4. 不启动 Redis 时运行 `npm start`，控制台输出 `Redis unavailable, using memory cache`，
   功能不受影响（首页、搜索、列表均正常）。

## 小结

- 缓存层对业务**零侵入**（统一 `cache` 接口）；
- 失败即降级，绝不阻塞主流程；
- 命中日志可通过 `redis-cli MONITOR` 实时观察。
