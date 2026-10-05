import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';
import type { DBUser } from './types.ts';
import type { User } from '../src/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pathpilot_production_secret_key_2026_xyz';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  user?: DBUser;
}

export function generateToken(user: DBUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function sanitizeUser(dbUser: DBUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    department: dbUser.department,
    year: dbUser.year,
    interest: dbUser.interest,
    targetRole: dbUser.targetRole,
    joinedDate: dbUser.joinedDate,
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = db.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please sign in again.' });
  }
}
