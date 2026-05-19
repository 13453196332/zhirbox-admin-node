const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rows = db.getAll('work_experiences');
  res.json(rows.map(r => ({ ...r, duties: Array.isArray(r.duties) ? r.duties : JSON.parse(r.duties || '[]') })));
});

router.post('/', (req, res) => {
  const { company, role, start_date, end_date = '', duties = '[]', sort_order = 0 } = req.body;
  const row = db.insert('work_experiences', { company, role, start_date, end_date, duties: JSON.stringify(duties), sort_order });
  res.json({ id: row.id });
});

router.put('/:id', (req, res) => {
  const { company, role, start_date, end_date, duties, sort_order } = req.body;
  db.update('work_experiences', Number(req.params.id), {
    company, role, start_date, end_date, duties: JSON.stringify(duties), sort_order
  });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.remove('work_experiences', Number(req.params.id));
  res.json({ success: true });
});

module.exports = router;
