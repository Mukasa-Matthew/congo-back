import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { db } from './config/database';
import authRoutes from './routes/auth';
import articlesRoutes from './routes/articles';
import categoriesRoutes from './routes/categories';
import tagsRoutes from './routes/tags';
import mediaRoutes from './routes/media';
import commentsRoutes from './routes/comments';
import homepageRoutes from './routes/homepage';
import dashboardRoutes from './routes/dashboard';
import newsletterRoutes from './routes/newsletter';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(cors());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Increase body parser limit to handle large base64 image/video uploads (50MB)
// This is necessary because base64 encoding increases file size by ~33%
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handler for payload too large (must be after routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ 
      message: 'File too large. Maximum size is 50MB. Please compress your image or video.' 
    });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

