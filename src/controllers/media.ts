import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';
import { getPublicUrl, getUploadsPath } from '../config/upload';
import fs from 'fs';
import path from 'path';

export const getMedia = async (req: AuthRequest, res: Response) => {
  try {
    const [media] = await dbPromise.execute(
      'SELECT * FROM media ORDER BY created_at DESC'
    );

    // Get base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Update URLs to include full path
    const mediaWithUrls = (media as any[]).map((item) => ({
      ...item,
      url: item.url.startsWith('http') 
        ? item.url 
        : `${baseUrl}${getPublicUrl(item.filename)}`,
    }));

    return res.json(mediaWithUrls);
  } catch (error) {
    console.error('Get media error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const uploadMedia = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    
    // Get base URL from request
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const publicUrl = `${baseUrl}${getPublicUrl(file.filename)}`;

    // Store media metadata in database
    const [result] = await dbPromise.execute(
      'INSERT INTO media (filename, url, size, mime_type) VALUES (?, ?, ?, ?)',
      [file.filename, publicUrl, file.size, file.mimetype]
    );

    return res.status(201).json({
      id: (result as any).insertId,
      filename: file.filename,
      url: publicUrl,
      size: file.size,
      mime_type: file.mimetype,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMedia = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Get media info before deleting
    const [media] = await dbPromise.execute(
      'SELECT filename FROM media WHERE id = ?',
      [id]
    );

    const mediaItem = (media as any[])[0];
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Delete from database
    await dbPromise.execute('DELETE FROM media WHERE id = ?', [id]);

    // Delete file from filesystem
    const filePath = path.join(getUploadsPath(), mediaItem.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ message: 'Media deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

