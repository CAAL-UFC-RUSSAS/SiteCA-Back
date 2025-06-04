const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('🔒 Middleware de autenticação iniciado');
  console.log('📝 Headers recebidos:', req.headers);
  
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('❌ Token não fornecido no header Authorization');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    console.log('❌ Token mal formatado:', authHeader);
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    console.log('❌ Token não segue o formato Bearer:', scheme);
    return res.status(401).json({ error: 'Token mal formatado' });
  }

  console.log('🔑 Verificando token JWT...');
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('✅ Token válido, usuário autenticado:', decoded.id);
    req.userId = decoded.id;
    return next();
  });
}; 