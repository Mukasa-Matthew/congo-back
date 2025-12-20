import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const [tags] = await dbPromise.execute(
      `SELECT t.*, COUNT(at.article_id) as article_count
       FROM tags t
       LEFT JOIN article_tags at ON t.id = at.tag_id
       GROUP BY t.id
       ORDER BY t.name ASC`
    );

    return res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [tags] = await dbPromise.execute('SELECT * FROM tags WHERE id = ?', [
      id,
    ]);

    const tag = (tags as any[])[0];

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    return res.json(tag);
  } catch (error) {
    console.error('Get tag error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const [result] = await dbPromise.execute(
      'INSERT INTO tags (name, slug) VALUES (?, ?)',
      [name, slug || name.toLowerCase().replace(/\s+/g, '-')]
    );

    return res.status(201).json({
      id: (result as any).insertId,
      message: 'Tag created',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    console.error('Create tag error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    await dbPromise.execute('UPDATE tags SET name = ?, slug = ? WHERE id = ?', [
      name,
      slug,
      id,
    ]);

    return res.json({ message: 'Tag updated' });
  } catch (error) {
    console.error('Update tag error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteTag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Remove tag associations
    await dbPromise.execute('DELETE FROM article_tags WHERE tag_id = ?', [id]);

    // Delete tag
    await dbPromise.execute('DELETE FROM tags WHERE id = ?', [id]);

    return res.json({ message: 'Tag deleted' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

