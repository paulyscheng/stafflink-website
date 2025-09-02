const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function checkJobRecordsStructure() {
  try {
    console.log('🔍 Checking job_records table structure...\n');

    // Get all columns from job_records table
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'job_records'
      ORDER BY ordinal_position
    `);

    console.log('📊 job_records table columns:');
    console.table(columns.rows);

    // Check if wage-related fields exist
    console.log('\n💰 Wage-related fields in job_records:');
    const wageFields = columns.rows.filter(col => 
      col.column_name.includes('wage') || 
      col.column_name.includes('payment') ||
      col.column_name.includes('hourly') ||
      col.column_name.includes('daily')
    );
    
    if (wageFields.length > 0) {
      console.table(wageFields);
    } else {
      console.log('No direct wage fields found in job_records table.');
    }

    // Check invitations table structure
    console.log('\n📋 Checking invitations table for wage fields:');
    const invitationColumns = await pool.query(`
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'invitations'
      AND (column_name LIKE '%wage%' OR column_name LIKE '%payment%')
      ORDER BY ordinal_position
    `);
    
    if (invitationColumns.rows.length > 0) {
      console.table(invitationColumns.rows);
    }

    // Check projects table structure
    console.log('\n📁 Checking projects table for wage fields:');
    const projectColumns = await pool.query(`
      SELECT 
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'projects'
      AND (column_name LIKE '%wage%' OR column_name LIKE '%payment%')
      ORDER BY ordinal_position
    `);
    
    if (projectColumns.rows.length > 0) {
      console.table(projectColumns.rows);
    }

    // Sample job records query
    console.log('\n📝 Sample job records with joined data:');
    const sampleRecords = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        jr.created_at,
        jr.worker_id,
        jr.company_id,
        jr.project_id,
        jr.invitation_id
      FROM job_records jr
      LIMIT 5
    `);

    if (sampleRecords.rows.length > 0) {
      console.table(sampleRecords.rows);
    } else {
      console.log('No job records found.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute
checkJobRecordsStructure();