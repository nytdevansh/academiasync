import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { logAudit } from '../services/auditService';
import { AuthRequest } from '../middlewares/auth';

const BCRYPT_SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate short-lived JWT access token (15 minutes by default)
 */
export const generateAccessToken = (user: { _id: unknown; role?: string }) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: ACCESS_TOKEN_EXPIRY as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Create and persist a hashed refresh token in MongoDB.
 * Returns the unhashed raw token string for the client.
 */
export const issueRefreshToken = async (userId: any): Promise<string> => {
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return rawRefreshToken;
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      department,
    });

    await logAudit(
      user._id,
      'create',
      'User',
      user._id,
      'User registered',
      null,
      user,
      req.ip,
      req.headers['user-agent'] as string
    );

    const token = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
        },
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    await logAudit(
      user._id,
      'login',
      'User',
      user._id,
      'User logged in',
      null,
      null,
      req.ip,
      req.headers['user-agent'] as string
    );

    const token = generateAccessToken(user);
    const refreshToken = await issueRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
        },
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const rawRefreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];

    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
    }

    if (req.user) {
      await logAudit(
        req.user._id,
        'logout',
        'User',
        req.user._id,
        'User logged out',
        null,
        null,
        req.ip,
        req.headers['user-agent'] as string
      );
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).select('-passwordHash').populate('department');
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Validates the refresh token, detects replay/reuse attacks,
 * atomically rotates both the refresh token and access token.
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const rawRefreshToken = req.body?.refreshToken || req.headers['x-refresh-token'];

    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required in body or x-refresh-token header',
      });
    }

    const incomingHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const existingToken = await RefreshToken.findOne({ tokenHash: incomingHash });

    if (!existingToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    // Reuse detection: If token was already revoked, someone may have stolen it
    if (existingToken.revoked) {
      // Invalidate all tokens belonging to this user family to protect account
      await RefreshToken.updateMany({ userId: existingToken.userId }, { revoked: true });

      await logAudit(
        existingToken.userId,
        'logout',
        'RefreshToken',
        existingToken._id,
        'Revoked refresh token reuse detected. All active user sessions revoked for security.',
        null,
        null,
        req.ip,
        req.headers['user-agent'] as string
      );

      return res.status(401).json({
        success: false,
        error: 'Revoked refresh token reuse detected. All sessions terminated for security.',
      });
    }

    // Expiration check
    if (existingToken.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ success: false, error: 'Refresh token has expired' });
    }

    const user = await User.findById(existingToken.userId).select('-passwordHash');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, error: 'User account is inactive or not found' });
    }

    // Generate new refresh token
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Atomically rotate: revoke old, save replacement reference
    existingToken.revoked = true;
    existingToken.replacedByTokenHash = newTokenHash;
    await existingToken.save();

    // Persist new token
    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      revoked: false,
    });

    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRawRefreshToken,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
