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
