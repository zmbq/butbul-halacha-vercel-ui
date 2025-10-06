const { Pool } = require('pg');

async function checkTranscriptionTable() {
  const pool = new Pool({ 
    connectionString: process.env.NEXT_PUBLIC_POSTGRES_URL 
  });
  
  try {
    // Try transcription_chunks first
    const chunksResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transcription_chunks' 
      ORDER BY ordinal_position
    `);
    
    if (chunksResult.rows.length > 0) {
      console.log('transcription_chunks table found:');
      console.table(chunksResult.rows);
    } else {
      console.log('transcription_chunks not found, checking transcription_segments...');
      const segmentsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'transcription_segments' 
        ORDER BY ordinal_position
      `);
      console.log('transcription_segments table:');
      console.table(segmentsResult.rows);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTranscriptionTable();
