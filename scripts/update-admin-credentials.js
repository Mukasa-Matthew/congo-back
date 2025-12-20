const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAdminCredentials() {
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_platform',
    });

    console.log('✅ Connected to MySQL');

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@news.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
      process.exit(1);
    }

    console.log(`\n📝 Updating admin credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${'*'.repeat(adminPassword.length)}`);

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Update admin user
    const [result] = await connection.query(
      `UPDATE users 
       SET email = ?, password = ? 
       WHERE role = 'admin' 
       LIMIT 1`,
      [adminEmail, hashedPassword]
    );

    if (result.affectedRows === 0) {
      // If no admin user exists, create one
      await connection.query(
        `INSERT INTO users (email, password, role) 
         VALUES (?, ?, 'admin')`,
        [adminEmail, hashedPassword]
      );
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin credentials updated successfully!');
    }

    console.log('\n💡 You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Error updating admin credentials:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateAdminCredentials();

