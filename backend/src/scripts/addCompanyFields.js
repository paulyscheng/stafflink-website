const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function addCompanyFields() {
  const client = await pool.connect();
  
  try {
    console.log('Adding new fields to companies table...\n');
    
    // 1. Add position field
    console.log('1. Adding position field...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS position VARCHAR(100)
      `);
      console.log('✅ Position field added');
    } catch (error) {
      console.log('⚠️  Position field may already exist:', error.message);
    }
    
    // 2. Add company_size field
    console.log('\n2. Adding company_size field...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS company_size VARCHAR(50)
      `);
      console.log('✅ Company size field added');
    } catch (error) {
      console.log('⚠️  Company size field may already exist:', error.message);
    }
    
    // 3. Add logo_url field
    console.log('\n3. Adding logo_url field...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS logo_url TEXT
      `);
      console.log('✅ Logo URL field added');
    } catch (error) {
      console.log('⚠️  Logo URL field may already exist:', error.message);
    }
    
    // 4. Add password field
    console.log('\n4. Adding password field...');
    try {
      await client.query(`
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS password VARCHAR(255)
      `);
      console.log('✅ Password field added');
    } catch (error) {
      console.log('⚠️  Password field may already exist:', error.message);
    }
    
    // 5. Check the updated table structure
    console.log('\n5. Checking updated table structure...');
    const checkQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'companies'
      ORDER BY ordinal_position
    `;
    
    const result = await client.query(checkQuery);
    console.log('\nUpdated companies table structure:');
    console.log('-----------------------------------');
    result.rows.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`${col.column_name}: ${col.data_type}${length}`);
    });
    
    console.log('\n✅ All fields have been added successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addCompanyFields();