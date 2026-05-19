const jwt = require('jsonwebtoken');

const SECRET = 'zhirbox_admin_secret_2025';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '未登录' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

module.exports = { authMiddleware, SECRET };
