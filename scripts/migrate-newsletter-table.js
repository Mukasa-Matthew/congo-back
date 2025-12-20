const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateNewsletterTable() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_platform',
    });

    console.log('✅ Connected to database');

    // Create newsletter_subscribers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    console.log('✅ Successfully created newsletter_subscribers table');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('already exists')) {
      console.log('⚠️  Table already exists');
    } else {
      console.error('❌ Migration error:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

migrateNewsletterTable();


