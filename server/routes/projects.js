const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = db.getAll('projects');
  res.json(rows.map(r => ({ ...r, tech_tags: Array.isArray(r.tech_tags) ? r.tech_tags : JSON.parse(r.tech_tags || '[]') })));
});

router.post('/', (req, res) => {
  const { title, role, description, tech_tags = '[]', icon = 'code', sort_order = 0 } = req.body;
  const row = db.insert('projects', { title, role, description, tech_tags: JSON.stringify(tech_tags), icon, sort_order });
  res.json({ id: row.id });
});

router.put('/:id', (req, res) => {
  const { title, role, description, tech_tags, icon, sort_order } = req.body;
  db.update('projects', Number(req.params.id), {
    title, role, description, tech_tags: JSON.stringify(tech_tags), icon, sort_order
  });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.remove('projects', Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
