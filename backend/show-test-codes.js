const crypto = require('crypto');

function generateSecureTestCode(phone) {
  const secret = process.env.TEST_CODE_SECRET || 'stafflink-dev-2024';
  const hash = crypto.createHmac('sha256', secret)
    .update(phone)
    .digest('hex');
  
  // Take first 6 digits
  const code = parseInt(hash.substring(0, 6), 16) % 1000000;
  return code.toString().padStart(6, '0');
}

console.log('\n📱 Test Account Verification Codes:\n');
console.log('=' .repeat(60));

const testPhones = [
  '13900139000',
  '13900139001',
  '13900139002',
  '13900139003',
  '13900139004',
  '13900139005',
  '13900139010'
];

testPhones.forEach(phone => {
  const code = generateSecureTestCode(phone);
  console.log(`Phone: ${phone}  →  Code: ${code}`);
});

console.log('=' .repeat(60));
console.log('\n⚠️  Note: These codes are generated dynamically based on phone number');
console.log('Use the exact code shown above for each phone number.\n');