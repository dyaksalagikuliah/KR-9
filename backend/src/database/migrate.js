const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database migration completed successfully!\n');

    // Show created tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✨ Migration finished!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
