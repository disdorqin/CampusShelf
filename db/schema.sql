-- ============================================================
-- CampusShelf MySQL Schema
-- 表结构：users / resources / favorites / comments
--         carts / cart_items / orders / order_items / wanted_posts
-- ============================================================

CREATE DATABASE IF NOT EXISTS campusshelf
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campusshelf;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL DEFAULT '',
  email       VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        ENUM('student','admin') NOT NULL DEFAULT 'student',
  campus      VARCHAR(100) DEFAULT '',
  status      ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Resources (校园资源)
CREATE TABLE IF NOT EXISTS resources (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  title           VARCHAR(255) NOT NULL,
  category        VARCHAR(50) NOT NULL,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_condition  VARCHAR(50) DEFAULT '',
  description     TEXT,
  image_url       VARCHAR(500) DEFAULT '',
  seller_id       BIGINT DEFAULT NULL,
  seller_name     VARCHAR(100) DEFAULT '',
  seller_contact  VARCHAR(100) DEFAULT '',
  campus          VARCHAR(100) DEFAULT '',
  course_name     VARCHAR(100) DEFAULT '',
  tags            TEXT,
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  views           INT NOT NULL DEFAULT 0,
  favorites_count INT NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_seller_id (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Favorites (收藏)
CREATE TABLE IF NOT EXISTS favorites (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_resource (user_id, resource_id),
  KEY idx_user_id (user_id),
  KEY idx_resource_id (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comments (评论)
CREATE TABLE IF NOT EXISTS comments (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  rating      INT NOT NULL DEFAULT 5,
  content     TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_resource_id (resource_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Carts (购物车)
CREATE TABLE IF NOT EXISTS carts (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Cart Items (购物车条目)
CREATE TABLE IF NOT EXISTS cart_items (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  cart_id     BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cart_id (cart_id),
  KEY idx_resource_id (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders (订单)
CREATE TABLE IF NOT EXISTS orders (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Order Items (订单条目)
CREATE TABLE IF NOT EXISTS order_items (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id    BIGINT NOT NULL,
  resource_id BIGINT DEFAULT NULL,
  title       VARCHAR(255) NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Wanted Posts (求购信息)
CREATE TABLE IF NOT EXISTS wanted_posts (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT DEFAULT NULL,
  title       VARCHAR(255) NOT NULL,
  category    VARCHAR(50) DEFAULT '',
  budget      DECIMAL(10,2) DEFAULT 0,
  course_name VARCHAR(100) DEFAULT '',
  campus      VARCHAR(100) DEFAULT '',
  description TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_category (category),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
