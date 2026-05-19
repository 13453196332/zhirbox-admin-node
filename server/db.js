/**
 * 简易 JSON 文件数据库
 * 每张表存一个 JSON 文件，支持 CRUD + 排序
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 表结构定义（用于初始化）
const TABLES = {
  users: { schema: ['id', 'username', 'password_hash', 'avatar', 'created_at'], autoId: true },
  site_config: { schema: ['id', 'config_key', 'config_value'], autoId: true },
  skills: { schema: ['id', 'name', 'level', 'category', 'sort_order'], autoId: true },
  work_experiences: { schema: ['id', 'company', 'role', 'start_date', 'end_date', 'duties', 'sort_order'], autoId: true },
  projects: { schema: ['id', 'title', 'role', 'description', 'tech_tags', 'icon', 'sort_order'], autoId: true },
  tools: { schema: ['id', 'title', 'description', 'url', 'icon', 'sort_order'], autoId: true },
};

// 默认数据
const DEFAULT_USERS = [
  { id: 1, username: 'admin', password_hash: require('bcryptjs').hashSync('admin123', 10), avatar: '', created_at: new Date().toISOString() }
];

const DEFAULT_SITE_CONFIG = [
  { id: 1, config_key: 'site_name', config_value: '纸盒人' },
  { id: 2, config_key: 'hero_title', config_value: '你好，我是纸盒人' },
  { id: 3, config_key: 'hero_subtitle', config_value: '用代码解决实际问题，探索 AI 与工具的可能性' },
  { id: 4, config_key: 'hero_badge', config_value: '前端开发者 / AI 工具探索者' },
  { id: 5, config_key: 'footer_text', config_value: 'Built with ❤ and ☕' },
  { id: 6, config_key: 'contact_email', config_value: 'whj1008611@gmail.com' },
  { id: 7, config_key: 'contact_steam', config_value: 'https://steamcommunity.com/profiles/76561198965005221/' },
];

const DEFAULTS = {
  users: DEFAULT_USERS,
  site_config: DEFAULT_SITE_CONFIG,
  skills: [],
  work_experiences: [],
  projects: [],
  tools: [],
};

// 读取表
function readTable(tableName) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    // 初始化默认数据
    const defaultData = DEFAULTS[tableName] || [];
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

// 写入表
function writeTable(tableName, data) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// 获取自增 ID
function nextId(tableName) {
  const rows = readTable(tableName);
  if (rows.length === 0) return 1;
  return Math.max(...rows.map(r => r.id)) + 1;
}

// ---- 公开 API ----

function getAll(tableName, sortBy = 'sort_order') {
  const rows = readTable(tableName);
  return rows.sort((a, b) => (a[sortBy] || 0) - (b[sortBy] || 0));
}

function getById(tableName, id) {
  const rows = readTable(tableName);
  return rows.find(r => r.id === id) || null;
}

function insert(tableName, data) {
  const rows = readTable(tableName);
  const id = nextId(tableName);
  const newRow = { id, ...data };
  rows.push(newRow);
  writeTable(tableName, rows);
  return newRow;
}

function update(tableName, id, data) {
  const rows = readTable(tableName);
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...data, id };
  writeTable(tableName, rows);
  return rows[idx];
}

function remove(tableName, id) {
  const rows = readTable(tableName);
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  writeTable(tableName, rows);
  return true;
}

function findBy(tableName, key, value) {
  const rows = readTable(tableName);
  return rows.find(r => r[key] === value) || null;
}

module.exports = { getAll, getById, insert, update, remove, findBy };
