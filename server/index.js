const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ---- 公开 API（无需登录） ----
app.get('/api/public/site-config', (req, res) => {
  const rows = db.getAll('site_config', 'id');
  const config = {};
  rows.forEach(r => config[r.config_key] = r.config_value);
  res.json(config);
});

app.get('/api/public/skills', (req, res) => {
  const rows = db.getAll('skills');
  res.json(rows.map(r => ({ id: r.id, name: r.name, level: r.level, category: r.category })));
});

app.get('/api/public/work-experiences', (req, res) => {
  const rows = db.getAll('work_experiences');
  res.json(rows.map(r => ({ ...r, duties: Array.isArray(r.duties) ? r.duties : JSON.parse(r.duties || '[]') })));
});

app.get('/api/public/projects', (req, res) => {
  const rows = db.getAll('projects');
  res.json(rows.map(r => ({ ...r, tech_tags: Array.isArray(r.tech_tags) ? r.tech_tags : JSON.parse(r.tech_tags || '[]') })));
});

app.get('/api/public/tools', (req, res) => {
  const rows = db.getAll('tools');
  res.json(rows);
});

// ---- 管理 API ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/work', require('./routes/work'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/config', require('./routes/config'));

// ---- 静态文件：网站页面（BOX 目录） ----
app.use(express.static(path.join(__dirname, '..', '..', 'BOX')));

// ---- 静态文件：Vue 构建产物 ----
const adminDist = path.join(__dirname, '..', 'admin', 'dist');
app.use('/admin', express.static(adminDist));
app.get('/admin/{*path}', (req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ 后台服务运行在 http://localhost:${PORT}`);
  console.log(`  管理面板 → http://localhost:${PORT}/admin`);
});
