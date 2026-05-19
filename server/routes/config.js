const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// 获取所有配置
router.get('/', (req, res) => {
  const rows = db.getAll('site_config', 'id');
  const config = {};
  rows.forEach(r => config[r.config_key] = r.config_value);
  res.json(config);
});

// 批量更新配置
router.put('/', (req, res) => {
  const updates = req.body; // { key: value, ... }
  for (const [key, value] of Object.entries(updates)) {
    const existing = db.findBy('site_config', 'config_key', key);
    if (existing) {
      db.update('site_config', existing.id, { config_value: value });
    } else {
      db.insert('site_config', { config_key: key, config_value: value });
    }
  }
  res.json({ success: true });
});

module.exports = router;
