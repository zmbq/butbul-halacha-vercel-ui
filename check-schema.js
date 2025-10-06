const { Pool } = require('pg');

async function checkSchema() {
  const connectionString = 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL || 
    process.env.NEXT_PUBLIC_POSTGRES_URL || 
    process.env.NEXT_PUBLIC_DATABASE_URL;

  if (!connectionString) {
    console.error('No database URL found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  
  try {
    console.log('Checking embeddings table schema...\n');
    
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'embeddings'
      ORDER BY ordinal_position
    `);
    
    console.log('Embeddings table columns:');
    console.table(result.rows);
    
    console.log('\nChecking embeddings_cache table schema...\n');
    
    const cacheResult = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'embeddings_cache'
      ORDER BY ordinal_position
    `);
    
    console.log('Embeddings_cache table columns:');
    console.table(cacheResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
