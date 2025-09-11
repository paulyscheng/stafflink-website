const db = require('../config/database');

async function checkCompanies() {
  try {
    console.log('🔍 Checking existing companies...\n');
    
    const result = await db.query('SELECT id, company_name, phone, contact_person FROM companies LIMIT 10');
    
    if (result.rows.length === 0) {
      console.log('❌ No companies found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} companies:\n`);
      result.rows.forEach((company, index) => {
        console.log(`${index + 1}. ${company.company_name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Contact: ${company.contact_person}`);
        console.log(`   Phone: ${company.phone}`);
        console.log('');
      });
    }
    
    // Check if the test company exists
    const testCompanyResult = await db.query(
      "SELECT * FROM companies WHERE id = '62dbe51e-2aae-499c-9783-2890a4a23dea'"
    );
    
    if (testCompanyResult.rows.length > 0) {
      console.log('✅ Test company found:', testCompanyResult.rows[0].company_name);
    } else {
      console.log('❌ Test company not found, creating one...');
      
      // Create test company
      const createResult = await db.query(`
        INSERT INTO companies (
          id, company_name, contact_person, position, phone, 
          email, address, industry, company_size, status
        ) VALUES (
          '62dbe51e-2aae-499c-9783-2890a4a23dea',
          '测试企业',
          '测试管理员',
          'HR总监',
          '13900139000',
          'test@company.com',
          '测试地址',
          '建筑装修',
          '50-100',
          'active'
        ) RETURNING *
      `);
      
      console.log('✅ Test company created:', createResult.rows[0].company_name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkCompanies();