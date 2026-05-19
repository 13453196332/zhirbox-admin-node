const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => res.json(db.getAll('tools')));

router.post('/', (req, res) => {
  const { title, description = '', url = '', icon = 'link', sort_order = 0 } = req.body;
  const row = db.insert('tools', { title, description, url, icon, sort_order });
  res.json({ id: row.id });
});

router.put('/:id', (req, res) => {
  const { title, description, url, icon, sort_order } = req.body;
  db.update('tools', Number(req.params.id), { title, description, url, icon, sort_order });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.remove('tools', Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
