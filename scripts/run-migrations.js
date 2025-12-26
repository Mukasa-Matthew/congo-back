const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, '../database/migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

async function runMigrations() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'news_platform',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Create migrations table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of executed migrations
    const [executedMigrations] = await connection.execute(
      `SELECT migration_name FROM ${MIGRATIONS_TABLE}`
    );
    const executedNames = executedMigrations.map(m => m.migration_name);

    // Get all migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration file(s)`);

    let executedCount = 0;

    for (const file of migrationFiles) {
      const migrationName = file;
      
      // Skip if already executed
      if (executedNames.includes(migrationName)) {
        console.log(`⏭️  Skipping ${migrationName} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${migrationName}`);

      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      try {
        // Execute migration
        await connection.query(migrationSQL);

        // Record migration as executed
        await connection.execute(
          `INSERT INTO ${MIGRATIONS_TABLE} (migration_name) VALUES (?)`,
          [migrationName]
        );

        console.log(`✅ Successfully executed: ${migrationName}`);
        executedCount++;
      } catch (error) {
        // If it's a "duplicate column" or "table exists" error, mark as executed
        if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  ${migrationName} appears to have been run manually. Marking as executed.`);
          try {
            await connection.execute(
              `INSERT IGNORE INTO ${MIGRATIONS_TABLE} (migration_name) VALUES (?)`,
              [migrationName]
            );
          } catch (insertError) {
            // Ignore duplicate entry errors
          }
        } else {
          throw error;
        }
      }
    }

    if (executedCount === 0) {
      console.log('✨ All migrations are up to date!');
    } else {
      console.log(`✨ Successfully executed ${executedCount} migration(s)`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();

