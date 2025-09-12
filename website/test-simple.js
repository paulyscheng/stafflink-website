const { chromium, devices } = require('playwright');

async function testResponsiveness() {
  let browser;
  
  try {
    console.log('🎭 Starting StaffLink Website Responsiveness Test...\n');
    
    // Launch browser with minimal permissions
    browser = await chromium.launch({ 
      headless: true,
      timeout: 30000
    });
    
    // Test configurations
    const tests = [
      { 
        name: 'iPhone 12', 
        device: devices['iPhone 12']
      },
      { 
        name: 'iPad', 
        device: devices['iPad (gen 7)']
      },
      { 
        name: 'Desktop', 
        viewport: { width: 1920, height: 1080 }
      }
    ];
    
    for (const test of tests) {
      console.log(`📱 Testing ${test.name}...`);
      
      const context = await browser.newContext(
        test.device || { viewport: test.viewport }
      );
      
      const page = await context.newPage();
      
      try {
        // Navigate to the website
        await page.goto('http://localhost:3001', { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        console.log(`  ✓ Page loaded`);
        
        // Check if main heading is visible
        const heading = await page.isVisible('h1:has-text("诸葛调度")');
        console.log(`  ✓ Main heading visible: ${heading}`);
        
        // Check CTA buttons
        const ctaCount = await page.locator('button:has-text("加入等待名单")').count();
        console.log(`  ✓ Found ${ctaCount} CTA buttons`);
        
        // Take screenshot
        const screenshotName = `screenshot-${test.name.toLowerCase().replace(' ', '-')}.png`;
        await page.screenshot({ 
          path: screenshotName,
          fullPage: false  // Just capture viewport
        });
        console.log(`  ✓ Screenshot saved: ${screenshotName}\n`);
        
      } catch (error) {
        console.log(`  ✗ Error testing ${test.name}: ${error.message}\n`);
      }
      
      await context.close();
    }
    
    console.log('✅ Responsiveness test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testResponsiveness();