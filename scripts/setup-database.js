const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split by semicolons
    const cleanedSchema = schema
      .split('\n')
      .map(line => {
        // Remove full-line comments
        if (line.trim().startsWith('--')) return '';
        // Remove inline comments
        const commentIndex = line.indexOf('--');
        if (commentIndex !== -1) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');

    // Split by semicolons and execute each statement
    const statements = cleanedSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Filter out the hardcoded admin INSERT statement - we'll handle it separately
    const filteredStatements = statements.filter(statement => {
      const lowerStatement = statement.toLowerCase().trim();
      // Skip the INSERT INTO users statement that has hardcoded admin credentials
      if (lowerStatement.includes("insert into users") && 
          (lowerStatement.includes("admin@news.com") || lowerStatement.includes("'admin@news.com'"))) {
        return false;
      }
      return true;
    });

    for (const statement of filteredStatements) {
      if (statement.length > 0) {
        try {
          await connection.query(statement);
          console.log('✅ Executed statement');
        } catch (error) {
          // Ignore errors for CREATE DATABASE IF NOT EXISTS and similar
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry')) {
            console.log('⚠️  Statement warning:', error.message);
          }
        }
      }
    }

    // Create admin user from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@news.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!adminEmail || !adminPassword) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set, using defaults');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insert or update admin user
    try {
      await connection.query(
        `INSERT INTO users (email, password, role) 
         VALUES (?, ?, 'admin')
         ON DUPLICATE KEY UPDATE password = VALUES(password), email = VALUES(email)`,
        [adminEmail, hashedPassword]
      );
      console.log('✅ Admin user created/updated');
    } catch (error) {
      if (!error.message.includes('Duplicate entry')) {
        console.error('❌ Error creating admin user:', error.message);
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('\n📝 Admin login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n💡 To change these, update ADMIN_EMAIL and ADMIN_PASSWORD in your .env file');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

