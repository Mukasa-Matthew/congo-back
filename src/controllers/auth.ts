import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { dbPromise } from '../config/database';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Email/Username and password required' });
    }

    // Try to find user by email or username
    const [users] = await dbPromise.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [loginIdentifier, loginIdentifier]
    );

    const user = (users as any[])[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'secret';
    
    const payload = { id: user.id, email: user.email, username: user.username, role: user.role };
    
    const token = jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      } as SignOptions
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await dbPromise.execute(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'admin']
    );

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [users] = await dbPromise.execute(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    const user = (users as any[])[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile (username, email and/or password)
export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { username, email, currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get current user
    const [users] = await dbPromise.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const user = (users as any[])[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Update username if provided
    if (username && username !== user.username) {
      // Check if username already exists
      const [existingUsers] = await dbPromise.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if ((existingUsers as any[]).length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      updates.push('username = ?');
      values.push(username);
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email already exists
      const [existingUsers] = await dbPromise.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if ((existingUsers as any[]).length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      updates.push('email = ?');
      values.push(email);
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    // If no updates, return success
    if (updates.length === 0) {
      return res.json({ message: 'No changes to update' });
    }

    // Update user
    updates.push('updated_at = NOW()');
    values.push(userId);

    await dbPromise.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user (without password)
    const [updatedUsers] = await dbPromise.execute(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: (updatedUsers as any[])[0],
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

