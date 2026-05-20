/**
 * SQLite 数据库（sql.js）
 * 纯 JS 实现，零原生依赖，全平台通用
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;
const api = {};

// 异步初始化（sql.js 需要加载 WASM）
const ready = (async function init() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');

  // ---- 建表 ----
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS site_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER DEFAULT 70,
    category TEXT DEFAULT 'frontend',
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS work_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    duties TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    role TEXT DEFAULT '',
    description TEXT DEFAULT '',
    tech_tags TEXT DEFAULT '[]',
    icon TEXT DEFAULT 'code',
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    icon TEXT DEFAULT 'link',
    sort_order INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS project_tech_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  )`);

  // ---- 种子数据（库为空时写入） ----
  const row = db.exec('SELECT COUNT(*) AS c FROM users');
  if (!row.length || !row[0].values.length || row[0].values[0][0] === 0) {
    // 管理员账号
    const hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users (username, password_hash, avatar, created_at) VALUES (?, ?, ?, ?)',
      ['admin', hash, '', new Date().toISOString()]);

    // 站点配置
    const siteConfigs = [
      ['site_name', '纸盒人'],
      ['hero_title', '你好，我是纸盒人'],
      ['hero_subtitle', '用代码解决实际问题，探索 AI 与工具的可能性'],
      ['hero_badge', '前端开发者 / AI 工具探索者'],
      ['footer_text', 'Built with ❤ and ☕'],
      ['contact_email', 'whj1008611@gmail.com'],
      ['contact_steam', 'https://steamcommunity.com/profiles/76561198965005221/'],
    ];
    const insCfg = db.prepare('INSERT INTO site_config (config_key, config_value) VALUES (?, ?)');
    siteConfigs.forEach(([k, v]) => insCfg.run([k, v]));

    // 技能
    const skills = [
      ['HTML5 / CSS3', 92, 'frontend', 0],
      ['JavaScript / TypeScript', 90, 'frontend', 1],
      ['Vue 全家桶', 85, 'frontend', 2],
      ['微信小程序', 82, 'frontend', 3],
      ['React', 65, 'frontend', 4],
      ['ElementUI / Layui', 88, 'frontend', 5],
      ['Git / 协同开发', 85, 'tools', 6],
      ['Axure / PxCook / PS', 78, 'tools', 7],
      ['AI 工具链 / Agent', 82, 'ai', 8],
      ['LLM 应用开发', 75, 'ai', 9],
    ];
    const insSkill = db.prepare('INSERT INTO skills (name, level, category, sort_order) VALUES (?, ?, ?, ?)');
    skills.forEach(s => insSkill.run(s));

    // 工作经历
    const insWork = db.prepare('INSERT INTO work_experiences (company, role, start_date, end_date, duties, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    insWork.run(['云流科技有限公司', '前端开发工程师', '2023.05', '', JSON.stringify(['Vue 技术栈', 'ElementUI', '跨平台开发', '兼容性测试']), 0]);
    insWork.run(['华一科技有限公司', '前端开发工程师', '2021.08', '2023.02', JSON.stringify(['Vue / jQuery', '微信小程序', 'PC + 移动端', '性能优化', 'UI 还原', '接口联调']), 1]);

    // 项目经历
    const insProj = db.prepare('INSERT INTO projects (title, role, description, tech_tags, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    insProj.run(['药品 SPD 管理系统', '前端开发', '基于 Vue 的药品 SPD 物流管理平台，覆盖供应商管理、库存监控、订单流转、配送追踪等核心功能。', JSON.stringify(['Vue.js', 'ElementUI', 'Axios', 'Vue Router']), 'truck', 0]);
    insProj.run(['山西省药械集中竞价采购网', '前端开发', '基于 Vue 的药械集中竞价采购平台及后台管理系统，涵盖采购公告发布、企业报价竞价、中标公示、订单管理等全流程功能。', JSON.stringify(['Vue.js', 'ElementUI', 'Axios', 'Vue Router']), 'gavel', 1]);
    insProj.run(['盈康一生供应链平台', '全栈前端', '基于 Vue2 的药品 SPD 物流管理平台，独立负责所有前端开发工作。', JSON.stringify(['Vue2', 'Pinia', 'Element']), 'truck', 2]);
    insProj.run(['药品耗材供应链服务平台', '前端开发', '基于 Vue + ECharts 的数字大屏与服务端渲染结合，实时展示全省药品耗材使用情况的全链路数据可视化平台。', JSON.stringify(['Vue', 'ECharts', '服务端渲染']), 'chart-bar', 3]);

    // 工具卡片
    const insTool = db.prepare('INSERT INTO tools (title, description, url, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
    insTool.run(['编码解析器', '解析 MA 编码、AHM 编码和 GS1 编码，快速获取产品标识与批次信息。', 'parse.html', 'barcode', 0]);
    insTool.run(['Excel 数据合并', '将源文件数据按列映射合并到目标文件，快速生成新 Excel 报表。', 'Excel.html', 'file-excel', 1]);
    insTool.run(['今天吃什么', '选择困难症的救星！随机推荐美食，告别「今天吃啥」的世纪难题。', 'FortuneTeller.html', 'utensils', 2]);
    insTool.run(['Web 3D 演示', '基于 Three.js 的地球 3D 交互展示，探索 Web 图形能力的边界。', 'new3D.html', 'globe', 3]);

    // 项目技术介绍
    const insTech = db.prepare('INSERT INTO project_tech_sections (section_key, title, content, sort_order) VALUES (?, ?, ?, ?)');
    insTech.run(['frontend', '前端页面展示', '<p>本站前端页面采用纯 <strong>HTML5 + CSS3 + JavaScript</strong> 构建，未使用任何前端框架，追求极致的轻量与可控性。</p><p>核心设计语言为深色赛博科技风格，基于 CSS 变量实现完整的设计令牌系统（Design Tokens），支持一键切换亮/暗主题。</p><p>关键特性：</p><ul><li><strong>毛玻璃导航栏</strong> — 固定定位 + backdrop-filter 毛玻璃效果，滚动时增强不透明度</li><li><strong>卡片式布局</strong> — 统一的 glass-card 组件系统，悬浮升高 + 发光描边</li><li><strong>响应式设计</strong> — 768px 断点切换移动端抽屉菜单，适配全设备</li><li><strong>Intersection Observer 动画</strong> — 滚动到视口时触发 fade-in-up 入场动画</li><li><strong>API 联动</strong> — 所有数据（工具卡片、技能、作品等）通过 fetch 从后端动态加载</li></ul>', 0]);
    insTech.run(['admin', '后台管理系统', '<p>后台管理系统基于 <strong>Vue 3 + Vite + Element Plus</strong> 构建，采用 Composition API + <code>script setup</code> 语法。</p><p>技术要点：</p><ul><li><strong>路由</strong> — Vue Router hash 模式，路由守卫自动拦截未登录请求，跳转至登录页</li><li><strong>状态管理</strong> — 无需 Pinia/Vuex，工具卡片、项目等数据通过 API 直接获取</li><li><strong>HTTP 客户端</strong> — Axios 封装，请求拦截自动注入 JWT Token，响应拦截 401 自动跳登录</li><li><strong>布局</strong> — 侧边栏导航 + 顶部栏布局，支持深色/亮色主题切换，主题偏好持久化到 localStorage</li><li><strong>构建部署</strong> — Vite 构建产物输出到 admin-dist 目录，由 Node.js 服务端作为静态文件托管</li></ul>', 1]);
    insTech.run(['backend', '后端 Node.js 服务', '<p>后端基于 <strong>Express 5 + SQLite (sql.js)</strong> 构建，零原生依赖，全平台可部署。</p><p>架构亮点：</p><ul><li><strong>数据库</strong> — 使用 sql.js（WebAssembly 版 SQLite），纯 JS 实现，无需安装任何原生模块</li><li><strong>认证</strong> — JWT Token 鉴权，bcryptjs 密码哈希，登录接口返回 token 并存储在 localStorage</li><li><strong>路由分层</strong> — 公共 API（<code>/api/public/*</code>）无需认证，管理 API（<code>/api/auth/*</code>）需 JWT 中间件保护</li><li><strong>静态托管</strong> — 同时托管前端网站（BOX/ 目录）和管理后台（admin-dist/ 目录）</li><li><strong>数据持久化</strong> — 每次写操作自动保存到 <code>data/app.db</code> 文件</li><li><strong>部署</strong> — 单文件启动，适合 Railway / Render / VPS 等云平台一键部署</li></ul>', 2]);

    save();
    console.log('✓ 数据库已初始化（含种子数据）');
  }

  // ---- 持久化到文件 ----
  function save() {
    fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  }

  // ---- 公开 API（与旧 JSON 版兼容） ----

  function queryAll(stmt) {
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  function queryOne(stmt, params) {
    if (params) stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  api.getAll = function(tableName, sortBy = 'sort_order') {
    return queryAll(db.prepare(`SELECT * FROM ${tableName} ORDER BY ${sortBy}`));
  };

  api.getById = function(tableName, id) {
    return queryOne(db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`), [id]);
  };

  api.insert = function(tableName, data) {
    const keys = Object.keys(data);
    const vals = keys.map(k => data[k]);
    const stmt = db.prepare(`INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`);
    const result = stmt.run(vals);
    stmt.free();
    save();
    return { id: Number(result.lastInsertRowid), ...data };
  };

  api.update = function(tableName, id, data) {
    const keys = Object.keys(data);
    const vals = keys.map(k => data[k]);
    vals.push(id);
    const stmt = db.prepare(`UPDATE ${tableName} SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`);
    stmt.run(vals);
    stmt.free();
    save();
    return api.getById(tableName, id);
  };

  api.remove = function(tableName, id) {
    const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id=?`);
    const result = stmt.run([id]);
    stmt.free();
    save();
    return result.changes > 0;
  };

  api.findBy = function(tableName, key, value) {
    return queryOne(db.prepare(`SELECT * FROM ${tableName} WHERE ${key}=?`), [value]);
  };
})();

module.exports = api;
module.exports.ready = ready;
