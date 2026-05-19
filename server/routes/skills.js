const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(db.getAll('skills')));

router.post('/', (req, res) => {
  const { name, level = 0, category = 'frontend', sort_order = 0 } = req.body;
  const row = db.insert('skills', { name, level, category, sort_order });
  res.json({ id: row.id });
});

router.put('/:id', (req, res) => {
  const { name, level, category, sort_order } = req.body;
  db.update('skills', Number(req.params.id), { name, level, category, sort_order });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.remove('skills', Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
