import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Total Articles
    const [totalArticles] = await dbPromise.execute(
      'SELECT COUNT(*) as count FROM articles'
    );
    const totalCount = (totalArticles as any[])[0].count;

    // Published Articles
    const [publishedArticles] = await dbPromise.execute(
      'SELECT COUNT(*) as count FROM articles WHERE status = "published"'
    );
    const publishedCount = (publishedArticles as any[])[0].count;

    // Drafts
    const [drafts] = await dbPromise.execute(
      'SELECT COUNT(*) as count FROM articles WHERE status = "draft"'
    );
    const draftsCount = (drafts as any[])[0].count;

    // Categories Count
    const [categories] = await dbPromise.execute(
      'SELECT COUNT(*) as count FROM categories'
    );
    const categoriesCount = (categories as any[])[0].count;

    // Total Views
    const [views] = await dbPromise.execute(
      'SELECT SUM(views) as total FROM articles'
    );
    const totalViews = (views as any[])[0].total || 0;

    // Trending Articles (top 5 by views)
    const [trending] = await dbPromise.execute(
      `SELECT id, title, views, created_at 
       FROM articles 
       WHERE status = 'published' 
       ORDER BY views DESC 
       LIMIT 5`
    );

    // Recent Articles
    const [recent] = await dbPromise.execute(
      `SELECT a.id, a.title, a.status, a.created_at, c.name as category_name
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       ORDER BY a.created_at DESC
       LIMIT 10`
    );

    return res.json({
      totalArticles: totalCount,
      publishedArticles: publishedCount,
      drafts: draftsCount,
      categoriesCount: categoriesCount,
      totalViews: totalViews,
      trendingArticles: trending,
      recentArticles: recent,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

