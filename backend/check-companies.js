const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./src/config/database');

async function checkCompanies() {
  try {
    const result = await db.query(`
      SELECT id, company_name, phone, contact_person, email 
      FROM companies 
      WHERE phone LIKE '139%' 
      ORDER BY phone
    `);
    
    console.log('\n📱 Test Company Accounts:\n');
    console.log('=' .repeat(60));
    
    if (result.rows.length === 0) {
      console.log('No test companies found.');
    } else {
      result.rows.forEach(company => {
        console.log(`Phone: ${company.phone}`);
        console.log(`Company: ${company.company_name}`);
        console.log(`Contact: ${company.contact_person}`);
        console.log(`Email: ${company.email || 'N/A'}`);
        console.log(`Verification Code: 123456`);
        console.log('-' .repeat(60));
      });
    }
    
    console.log('\n✅ All test accounts use verification code: 123456');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit();
  }
}

checkCompanies();