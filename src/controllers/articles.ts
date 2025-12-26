import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { dbPromise } from '../config/database';

// Helper function to convert ISO datetime string to MySQL datetime format
const convertToMySQLDateTime = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  
  try {
    // If it's already in MySQL format (YYYY-MM-DD HH:MM:SS), return as is
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Convert ISO string to MySQL datetime format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // Use UTC methods to preserve the original timezone from ISO string
    // This ensures we don't convert to server's local timezone
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error converting datetime:', error);
    return null;
  }
};

export const getArticles = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT a.*, c.name as category_name, 
             GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND a.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Convert limit and offset to integers and add directly to query (safe since we validate them)
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);
    
    // Order by published_at if available, otherwise created_at (latest first)
    query += ` GROUP BY a.id ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [articles] = await dbPromise.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM articles WHERE 1=1';
    const countParams: any[] = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (category) {
      countQuery += ' AND category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR excerpt LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await dbPromise.execute(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    return res.json({
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [articles] = await dbPromise.execute(
      `SELECT a.*, c.name as category_name,
              GROUP_CONCAT(t.id) as tag_ids,
              GROUP_CONCAT(t.name) as tag_names
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN article_tags at ON a.id = at.article_id
       LEFT JOIN tags t ON at.tag_id = t.id
       WHERE a.id = ?
       GROUP BY a.id`,
      [id]
    );

    const article = (articles as any[])[0];

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Parse tags
    article.tags = article.tag_ids
      ? article.tag_ids.split(',').map((id: string, index: number) => ({
          id: Number(id),
          name: article.tag_names.split(',')[index],
        }))
      : [];

    delete article.tag_ids;
    delete article.tag_names;

    return res.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const createArticle = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      excerpt,
      body,
      featured_image,
      category_id,
      tags,
      meta_title,
      meta_description,
      status,
      scheduled_publish_date,
    } = req.body;

    // Handle featured_image URL (now stored as TEXT, no truncation needed)
    const featuredImageUrl = featured_image ? String(featured_image) : null;

    const [result] = await dbPromise.execute(
      `INSERT INTO articles 
       (title, excerpt, body, featured_image, category_id, meta_title, meta_description, status, scheduled_publish_date, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        excerpt,
        body,
        featuredImageUrl,
        category_id || null,
        meta_title,
        meta_description,
        status || 'draft',
        convertToMySQLDateTime(scheduled_publish_date),
        req.user?.id,
      ]
    );

    const articleId = (result as any).insertId;

    // Add tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await dbPromise.execute(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [articleId, tagId]
        );
      }
    }

    return res.status(201).json({ id: articleId, message: 'Article created' });
  } catch (error) {
    console.error('Create article error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      excerpt,
      body,
      featured_image,
      category_id,
      tags,
      meta_title,
      meta_description,
      status,
      scheduled_publish_date,
    } = req.body;

    // Handle featured_image URL (now stored as TEXT, no truncation needed)
    const featuredImageUrl = featured_image ? String(featured_image) : null;

    // Validate status if provided
    const validStatuses = ['draft', 'published', 'archived'];
    let finalStatus = status;
    if (status && typeof status === 'string' && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Get current article to check existing status and published_at
    const [currentArticleRows] = await dbPromise.execute(
      'SELECT status, published_at FROM articles WHERE id = ?',
      [id]
    );
    
    const articleRows = currentArticleRows as any[];
    const article = articleRows && articleRows.length > 0 ? articleRows[0] : null;
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Use provided status or keep current status
    finalStatus = finalStatus || article.status || 'draft';

    // Check if status is being changed to 'published' and set published_at if not already set
    let publishedAtUpdate = '';
    if (finalStatus === 'published' && !article.published_at) {
      publishedAtUpdate = ', published_at = NOW()';
    }

    await dbPromise.execute(
      `UPDATE articles 
       SET title = ?, excerpt = ?, body = ?, featured_image = ?, 
           category_id = ?, meta_title = ?, meta_description = ?, 
           status = ?, scheduled_publish_date = ?, updated_at = NOW()${publishedAtUpdate}
       WHERE id = ?`,
      [
        title,
        excerpt,
        body,
        featuredImageUrl,
        category_id || null,
        meta_title,
        meta_description,
        finalStatus,
        convertToMySQLDateTime(scheduled_publish_date),
        id,
      ]
    );

    // Update tags
    await dbPromise.execute('DELETE FROM article_tags WHERE article_id = ?', [
      id,
    ]);

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await dbPromise.execute(
          'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        );
      }
    }

    return res.json({ message: 'Article updated' });
  } catch (error: any) {
    console.error('Update article error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      errno: error?.errno,
      sql: error?.sql,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return res.status(500).json({ message: 'Server error', error: error?.message || 'Unknown error' });
  }
};

export const deleteArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Delete tags associations
    await dbPromise.execute('DELETE FROM article_tags WHERE article_id = ?', [
      id,
    ]);

    // Delete comments
    await dbPromise.execute('DELETE FROM comments WHERE article_id = ?', [id]);

    // Delete article
    await dbPromise.execute('DELETE FROM articles WHERE id = ?', [id]);

    return res.json({ message: 'Article deleted' });
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const publishArticle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await dbPromise.execute(
      'UPDATE articles SET status = "published", published_at = NOW() WHERE id = ?',
      [id]
    );

    return res.json({ message: 'Article published' });
  } catch (error) {
    console.error('Publish article error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Public endpoints (no authentication required)
export const getPublicArticles = async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT a.*, c.name as category_name, 
             GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.status = 'published'
    `;
    const params: any[] = [];

    if (category) {
      query += ' AND a.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);
    
    // Order by published_at if available, otherwise created_at (latest first)
    query += ` GROUP BY a.id ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [articles] = await dbPromise.execute(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM articles WHERE status = 'published'";
    const countParams: any[] = [];

    if (category) {
      countQuery += ' AND category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (title LIKE ? OR excerpt LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await dbPromise.execute(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    return res.json({
      articles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get public articles error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getTrendingArticles = async (req: any, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = Math.max(1, Math.min(20, parseInt(String(limit), 10) || 5));

    // Use limit directly in query string (safe since we validate it above)
    const [articles] = await dbPromise.execute(
      `SELECT a.*, c.name as category_name, 
              GROUP_CONCAT(t.name) as tags
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN article_tags at ON a.id = at.article_id
       LEFT JOIN tags t ON at.tag_id = t.id
       WHERE a.status = 'published'
       GROUP BY a.id
       ORDER BY a.views DESC, a.published_at DESC
       LIMIT ${limitNum}`
    );

    return res.json({ articles });
  } catch (error) {
    console.error('Get trending articles error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getRelatedArticles = async (req: any, res: Response) => {
  try {
    const { id, category, limit = 4 } = req.query;
    const limitNum = Math.max(1, Math.min(10, parseInt(String(limit), 10) || 4));

    let query = `
      SELECT a.*, c.name as category_name, 
             GROUP_CONCAT(t.name) as tags
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.status = 'published' AND a.id != ?
    `;
    const params: any[] = [id];

    if (category) {
      query += ' AND a.category_id = ?';
      params.push(category);
    }

    // Use limit directly in query string (safe since we validate it above)
    query += ` GROUP BY a.id ORDER BY a.views DESC, a.published_at DESC LIMIT ${limitNum}`;

    const [articles] = await dbPromise.execute(query, params);

    return res.json({ articles });
  } catch (error) {
    console.error('Get related articles error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicArticle = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    const [articles] = await dbPromise.execute(
      `SELECT a.*, c.name as category_name,
              GROUP_CONCAT(t.id) as tag_ids,
              GROUP_CONCAT(t.name) as tag_names
       FROM articles a
       LEFT JOIN categories c ON a.category_id = c.id
       LEFT JOIN article_tags at ON a.id = at.article_id
       LEFT JOIN tags t ON at.tag_id = t.id
       WHERE a.id = ? AND a.status = 'published'
       GROUP BY a.id`,
      [id]
    );

    const article = (articles as any[])[0];

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    await dbPromise.execute(
      'UPDATE articles SET views = views + 1 WHERE id = ?',
      [id]
    );

    // Parse tags
    article.tags = article.tag_ids
      ? article.tag_ids.split(',').map((id: string, index: number) => ({
          id: Number(id),
          name: article.tag_names.split(',')[index],
        }))
      : [];

    delete article.tag_ids;
    delete article.tag_names;

    return res.json(article);
  } catch (error) {
    console.error('Get public article error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

