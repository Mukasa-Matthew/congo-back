import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT c.*, a.title as article_title
      FROM comments c
      LEFT JOIN articles a ON c.article_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const [comments] = await dbPromise.execute(query, params);

    return res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const approveComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await dbPromise.execute(
      'UPDATE comments SET status = "approved" WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Comment approved' });
  } catch (error) {
    console.error('Approve comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await dbPromise.execute('DELETE FROM comments WHERE id = ?', [id]);

    return res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const toggleComments = async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.body;

    // This would typically be stored in a settings table
    // For now, we'll just return success
    return res.json({ message: 'Comments toggled', enabled });
  } catch (error) {
    console.error('Toggle comments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

