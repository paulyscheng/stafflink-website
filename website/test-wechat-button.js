const { chromium } = require('playwright');

(async () => {
  // Launch browser with WeChat-like user agent
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0(0x18000000) NetType/WIFI Language/zh_CN',
    viewport: { width: 390, height: 844 },
    isMobile: true
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  console.log('Opening localhost:3000...');
  await page.goto('http://localhost:3000');
  
  // Wait for page to load
  await page.waitForTimeout(3000);

  // Check if WeChat is detected
  const isWeChat = await page.evaluate(() => {
    return window.navigator.userAgent.toLowerCase().includes('micromessenger');
  });
  console.log('WeChat detected:', isWeChat);

  // Look for the play button
  const playButton = await page.$('div[class*="z-20"][class*="cursor-pointer"]');
  
  if (playButton) {
    console.log('Play button found!');
    
    // Get button details
    const buttonInfo = await page.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        visible: el.offsetParent !== null,
        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        zIndex: styles.zIndex,
        pointerEvents: styles.pointerEvents,
        display: styles.display,
        opacity: styles.opacity,
        clickable: !el.disabled && styles.pointerEvents !== 'none'
      };
    }, playButton);
    
    console.log('Button info:', buttonInfo);

    // Check what elements are at the click position
    const centerX = buttonInfo.position.x + buttonInfo.position.width / 2;
    const centerY = buttonInfo.position.y + buttonInfo.position.height / 2;
    
    const elementAtPoint = await page.evaluate(({x, y}) => {
      const el = document.elementFromPoint(x, y);
      if (el) {
        return {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          computedZIndex: window.getComputedStyle(el).zIndex
        };
      }
      return null;
    }, {x: centerX, y: centerY});
    
    console.log('Element at click point:', elementAtPoint);

    // Try to click
    try {
      console.log('Attempting to click play button...');
      await playButton.click({ force: false });
      console.log('Click successful!');
    } catch (error) {
      console.log('Click failed:', error.message);
      
      // Try force click
      console.log('Trying force click...');
      await playButton.click({ force: true });
      console.log('Force click executed');
    }

    // Check if video started playing
    await page.waitForTimeout(2000);
    const videoPlaying = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video && !video.paused;
    });
    console.log('Video playing:', videoPlaying);

  } else {
    console.log('Play button not found!');
    
    // List all elements with z-index
    const zIndexElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const zIndexed = [];
      elements.forEach(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        if (zIndex !== 'auto' && zIndex !== '0') {
          zIndexed.push({
            tagName: el.tagName,
            className: el.className.substring(0, 100),
            zIndex: zIndex
          });
        }
      });
      return zIndexed.sort((a, b) => parseInt(b.zIndex) - parseInt(a.zIndex));
    });
    
    console.log('Elements with z-index:', zIndexElements);
  }

  // Keep browser open for inspection
  console.log('\nBrowser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
})();