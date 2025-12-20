import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const [categories] = await dbPromise.execute(
      `SELECT c.*, COUNT(a.id) as article_count
       FROM categories c
       LEFT JOIN articles a ON c.id = a.category_id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    return res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [categories] = await dbPromise.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    const category = (categories as any[])[0];

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const [result] = await dbPromise.execute(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug || name.toLowerCase().replace(/\s+/g, '-'), description]
    );

    return res.status(201).json({
      id: (result as any).insertId,
      message: 'Category created',
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Category already exists' });
    }
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    await dbPromise.execute(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?',
      [name, slug, description, id]
    );

    return res.json({ message: 'Category updated' });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has articles
    const [articles] = await dbPromise.execute(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );

    if ((articles as any[])[0].count > 0) {
      return res
        .status(400)
        .json({ message: 'Cannot delete category with articles' });
    }

    await dbPromise.execute('DELETE FROM categories WHERE id = ?', [id]);

    return res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

