const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateFeaturedImageToLongText() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_platform',
    });

    console.log('✅ Connected to database');

    // Alter the featured_image column to LONGTEXT to support very long data URLs (up to 4GB)
    await connection.execute(
      'ALTER TABLE articles MODIFY COLUMN featured_image LONGTEXT'
    );

    console.log('✅ Successfully updated featured_image column to LONGTEXT');
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('already exists')) {
      console.log('⚠️  Column already updated');
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

migrateFeaturedImageToLongText();


