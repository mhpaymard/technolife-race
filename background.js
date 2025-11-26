// Background service worker for handling communication between tabs
let verificationCode = null;
let paymentTabId = null;

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // Message from time-tunnel page with the verification code
  if (message.type === 'CODE_FOUND') {
    console.log('Code received from time-tunnel:', message.code);
    verificationCode = message.code;
    
    // Find and notify payment tab immediately
    chrome.tabs.query({
      url: [
        'https://www.technolife.com/payment*',
        'https://www.technolife.com/payment/*'
      ]
    }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'INSERT_CODE',
            code: verificationCode
          }).catch(err => console.log('Tab not ready:', err));
        });
      }
    });
    
    sendResponse({ success: true });
    return true;
  }
  
  // Message from payment page requesting the code
  if (message.type === 'REQUEST_CODE') {
    console.log('Payment page requesting code');
    paymentTabId = sender.tab.id;
    
    if (verificationCode) {
      sendResponse({ 
        success: true, 
        code: verificationCode 
      });
    } else {
      sendResponse({ 
        success: false, 
        message: 'No code available yet' 
      });
    }
    return true;
  }
  
  // Message from payment page confirming code insertion
  if (message.type === 'CODE_INSERTED') {
    console.log('Code successfully inserted in payment page');
    sendResponse({ success: true });
    return true;
  }
});

// Listen for tab updates to inject code into newly loaded payment pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && verificationCode) {
    if (tab.url && tab.url.includes('www.technolife.com/payment')) {
      // Give the content script a moment to initialize
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          type: 'INSERT_CODE',
          code: verificationCode
        }).catch(err => console.log('Tab not ready yet:', err));
      }, 100);
    }
  }
});

// Function to inject content scripts into existing tabs
async function injectIntoExistingTabs() {
  console.log('Checking for existing tabs...');
  
  try {
    // Find all matching tabs
    const tabs = await chrome.tabs.query({
      url: [
        'https://cmp.technolife.com/time-tunnel*',
        'https://cmp.technolife.com/time-tunnel/*',
        'https://www.technolife.com/payment*',
        'https://www.technolife.com/payment/*',
        'https://technolife.com/payment*',
        'https://technolife.com/payment/*',
      ]
    });
    
    console.log(`Found ${tabs.length} matching tabs`);
    
    for (const tab of tabs) {
      try {
        // Determine which script to inject based on URL
        let scriptFile = null;
        
        if (tab.url.includes('cmp.technolife.com/time-tunnel')) {
          scriptFile = 'content-time-tunnel.js';
          console.log(`Injecting time-tunnel script into tab ${tab.id}`);
        } else if (tab.url.includes('www.technolife.com/payment')) {
          scriptFile = 'content-payment.js';
          console.log(`Injecting payment script into tab ${tab.id}`);
        }
        
        if (scriptFile) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [scriptFile]
          });
          console.log(`✅ Script injected successfully into tab ${tab.id}`);
        }
      } catch (err) {
        console.log(`Failed to inject into tab ${tab.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error querying tabs:', err);
  }
}

// Clear code and inject scripts when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  verificationCode = null;
  console.log('Extension installed/updated - code cache cleared');
  
  // Inject scripts into existing tabs
  setTimeout(() => {
    injectIntoExistingTabs();
  }, 100);
});

// Also inject scripts when extension starts up (browser restart)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started - checking for existing tabs');
  setTimeout(() => {
    injectIntoExistingTabs();
  }, 500);
});
