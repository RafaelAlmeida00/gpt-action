import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../types/index.js';

const jwtSecret = process.env.SUPABASE_JWT_SECRET || 'dev-secret';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
    req.user = { id: decoded.sub as string, email: decoded.email as string };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
