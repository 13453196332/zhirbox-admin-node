const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// 获取所有技术介绍章节
router.get('/', (req, res) => {
  const rows = db.getAll('project_tech_sections');
  res.json(rows);
});

// 新增章节
router.post('/', (req, res) => {
  const { section_key, title, content = '', sort_order = 0 } = req.body;
  const row = db.insert('project_tech_sections', { section_key, title, content, sort_order });
  res.json({ id: row.id });
});

// 更新章节
router.put('/:id', (req, res) => {
  const { title, content, sort_order } = req.body;
  db.update('project_tech_sections', Number(req.params.id), { title, content, sort_order });
  res.json({ success: true });
});

// 删除章节
router.delete('/:id', (req, res) => {
  db.remove('project_tech_sections', Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
