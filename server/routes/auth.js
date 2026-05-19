const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const user = db.findBy('users', 'username', username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, avatar: user.avatar });
});

// 获取当前用户
router.get('/me', authMiddleware, (req, res) => {
  const user = db.getById('users', req.user.id);
  res.json({ id: user.id, username: user.username, avatar: user.avatar });
});

// 修改密码
router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.getById('users', req.user.id);
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
    return res.status(400).json({ error: '原密码错误' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.update('users', req.user.id, { password_hash: hash });
  res.json({ success: true });
});

module.exports = router;
