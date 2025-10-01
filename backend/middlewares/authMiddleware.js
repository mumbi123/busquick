import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // Skip CORS preflight
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  console.log('Incoming Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized', success: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.jwt_secret);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).send({ message: 'Unauthorized', success: false });
  }
};

export default authMiddleware;
