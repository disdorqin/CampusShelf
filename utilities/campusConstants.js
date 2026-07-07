/**
 * CampusShelf shared constants: resource categories and statuses.
 * Used by data layer, routes and views so labels stay consistent.
 */

const CATEGORIES = [
  { key: 'textbook', label: '二手教材', icon: '📚', color: '#4f46e5' },
  { key: 'notes',    label: '课程笔记', icon: '📝', color: '#0891b2' },
  { key: 'exam',     label: '考研资料', icon: '🎯', color: '#db2777' },
  { key: 'report',   label: '实验报告', icon: '🧪', color: '#16a34a' },
  { key: 'ebook',    label: '电子书',   icon: '📱', color: '#ea580c' },
  { key: 'supplies', label: '学习用品', icon: '🛠️', color: '#ca8a04' }
];

const STATUS = {
  pending:  { label: '待审核', color: '#f59e0b' },
  approved: { label: '已通过', color: '#16a34a' },
  rejected: { label: '已拒绝', color: '#dc2626' },
  sold:     { label: '已售出', color: '#6b7280' }
};

const ORDER_STATUS = {
  pending:   { label: '待确认', color: '#f59e0b' },
  completed: { label: '已完成', color: '#16a34a' },
  cancelled: { label: '已取消', color: '#dc2626' }
};

const CATEGORY_MAP = CATEGORIES.reduce((m, c) => (m[c.key] = c, m), {});
const STATUS_MAP = Object.assign({}, STATUS, ORDER_STATUS);

module.exports = { CATEGORIES, STATUS, ORDER_STATUS, CATEGORY_MAP, STATUS_MAP };
