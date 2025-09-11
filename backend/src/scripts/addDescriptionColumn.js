const db = require('../config/database');
const logger = require('../utils/logger');

async function addDescriptionColumn() {
  try {
    console.log('🔧 Adding description column to companies table...\n');
    
    // First check if the column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'description';
    `;
    
    const checkResult = await db.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Column "description" already exists in companies table');
      return;
    }
    
    // Add the description column
    const alterQuery = `
      ALTER TABLE companies 
      ADD COLUMN description TEXT;
    `;
    
    await db.query(alterQuery);
    console.log('✅ Successfully added description column to companies table');
    
    // Show updated table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await db.query(structureQuery);
    
    console.log('\n📋 Updated companies table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding description column:', error);
  } finally {
    process.exit(0);
  }
}

addDescriptionColumn();