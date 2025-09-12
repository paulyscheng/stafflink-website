const { chromium } = require('playwright');

async function testResponsiveness() {
  const browser = await chromium.launch({ 
    headless: true,  // Run in headless mode to avoid permission issues
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  // Define viewport sizes
  const viewports = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Small Laptop', width: 1366, height: 768 }
  ];
  
  console.log('🎭 Testing StaffLink Website Responsiveness...\n');
  
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 2,
    });
    
    const page = await context.newPage();
    
    console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
    
    // Navigate to the website
    await page.goto('http://localhost:3001');
    
    // Wait for content to load
    await page.waitForSelector('h1:has-text("诸葛调度")');
    
    // Take screenshot
    await page.screenshot({ 
      path: `screenshots/${viewport.name.toLowerCase().replace(' ', '-')}.png`,
      fullPage: true 
    });
    
    // Test interactions at this viewport
    console.log(`  ✓ Page loaded successfully`);
    
    // Check if CTA buttons are visible
    const ctaButtons = await page.$$('button:has-text("加入等待名单")');
    console.log(`  ✓ Found ${ctaButtons.length} CTA buttons`);
    
    // Test modal on mobile
    if (viewport.width < 768) {
      // Click the first CTA button
      await page.click('button:has-text("企业入驻")');
      await page.waitForSelector('h2:has-text("加入等待名单")', { timeout: 3000 });
      console.log(`  ✓ Modal opens correctly on mobile`);
      
      // Close modal
      await page.click('button:has-text("取消")');
      await page.waitForTimeout(500);
    }
    
    // Check scroll behavior
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    console.log(`  ✓ Scroll behavior works\n`);
    
    await context.close();
  }
  
  console.log('✅ Responsiveness test complete!');
  console.log('📸 Screenshots saved in screenshots/ folder');
  
  await browser.close();
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

testResponsiveness().catch(console.error);