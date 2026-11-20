import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sls_crm_super_secret_jwt_key_2026_shubham_leads'
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

// In-memory cache for active sessions (TTL: 60 seconds) to eliminate redundant roundtrips
const sessionCache = new Map<string, { user: any; expiresAt: number }>();

export function invalidateUserCache(userId?: string) {
  if (userId) {
    sessionCache.delete(userId);
  } else {
    sessionCache.clear();
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('sls_token')?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    // Check high-speed memory cache first (0ms response)
    const cached = sessionCache.get(payload.userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      sessionCache.delete(payload.userId);
      return null;
    }

    // Cache valid user for 60 seconds
    sessionCache.set(payload.userId, {
      user,
      expiresAt: Date.now() + 60 * 1000,
    });

    return user;
  } catch {
    return null;
  }
}
