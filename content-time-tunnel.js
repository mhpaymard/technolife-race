// Content script for time-tunnel page
// This script monitors for verification code in DOM

// ==================== CONFIG - EDIT THESE SELECTORS ====================
const CONFIG = {
  // Enable/Disable monitoring methods
  ENABLE_XHR_INTERCEPTION: true,   // Use XHR/Fetch interception (faster, more reliable)
  ENABLE_DOM_MONITORING: false,     // Use DOM monitoring as fallback
  
  // Input selector for DOM monitoring
  CODE_INPUT_SELECTOR: 'span.border.border-dashed',

  // Check interval in milliseconds (25ms = very fast, 40 checks per second)
  CHECK_INTERVAL_MS: 25,
  
  // Stop monitoring after code is found and sent (true = more efficient)
  STOP_AFTER_SEND: true,
  
  // Invalid codes to ignore (continue searching if these values found)
  INVALID_CODES: ['GLLZ5R4GGHY3', 'OIUYGS3547',"MHZJXU7SXAK5"]
};
// =======================================================================

console.log('Time-tunnel content script loaded');

let lastCodeSent = null;
let checkInterval = null;

// ==================== XHR/FETCH INTERCEPTION ====================
// Inject script into page context to intercept XHR/Fetch
function injectInterceptor() {
  if (!CONFIG.ENABLE_XHR_INTERCEPTION) {
    console.log('⚠️ XHR interception disabled in CONFIG');
    return;
  }
  
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected-script.js');
  script.onload = function() {
    this.remove();
    console.log('✅ Interceptor script injected');
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for intercepted XHR/Fetch responses via custom event
window.addEventListener('XHR_INTERCEPTED', (event) => {
  const { type, url, response, status } = event.detail;
  
  // console.log(`[${type.toUpperCase()} CAPTURED]`, url, response); // Disabled to reduce console clutter
  
  // Check if this is the voucher API response
  if (url.includes('time-tunnel/api/v1/Prize/voucher') && response?.data?.voucherCode) {
    const code = response.data.voucherCode;
    
    // Check if code is valid (not empty, not in invalid list, and not already sent)
    const isValidCode = code && 
                        code.trim() !== '' && 
                        !CONFIG.INVALID_CODES.includes(code.trim()) &&
                        code !== lastCodeSent;
    
    if (isValidCode) {
      // console.log('✅ Valid voucher code extracted from XHR:', code); // Disabled
      lastCodeSent = code;
      
      // Send code to background script immediately
      chrome.runtime.sendMessage({
        type: 'CODE_FOUND',
        code: code.trim()
      }, (response) => {
        if (response && response.success) {
          // console.log('✅ Code sent to background successfully'); // Disabled
        }
      });
    } else if (code && CONFIG.INVALID_CODES.includes(code.trim())) {
      // console.log('⚠️ Invalid code detected in XHR, ignoring:', code.trim()); // Disabled
    } else if (code === lastCodeSent) {
      // console.log('⚠️ Code already sent, ignoring duplicate:', code.trim()); // Disabled
    }
  }
});

// Inject as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectInterceptor);
} else {
  injectInterceptor();
}
// ================================================================

// Start monitoring DOM
function startMonitoring() {
  if (!CONFIG.ENABLE_DOM_MONITORING) {
    console.log('⚠️ DOM monitoring disabled in CONFIG');
    return;
  }
  
  // Clear any existing interval
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  console.log('Starting DOM monitoring...');
  
  // Check every interval for the input element
  checkInterval = setInterval(() => {

    const codeInput = document.querySelector(CONFIG.CODE_INPUT_SELECTOR);

    if (codeInput) {
      const code = codeInput.innerText;
      
      // Check if code is valid (not empty, not in invalid list, and not already sent)
      const isValidCode = code && 
                          code.trim() !== '' && 
                          !CONFIG.INVALID_CODES.includes(code.trim()) &&
                          code !== lastCodeSent;
      
      if (isValidCode) {
        console.log('Valid verification code found:', code);
        lastCodeSent = code;
        
        // Send code to background script immediately
        chrome.runtime.sendMessage({
          type: 'CODE_FOUND',
          code: code.trim()
        }, (response) => {
          if (response && response.success) {
            console.log('Code sent to background successfully');
            
            // Stop monitoring after successful send (if configured)
            if (CONFIG.STOP_AFTER_SEND) {
              clearInterval(checkInterval);
              checkInterval = null;
              console.log('Monitoring stopped - code sent successfully');
            }
          }
        });
      } else if (code && CONFIG.INVALID_CODES.includes(code.trim())) {
        console.log('Invalid code detected, continuing search:', code.trim());
      }
    }
    
  }, CONFIG.CHECK_INTERVAL_MS);
}

// Initialize DOM monitoring when page loads
if (CONFIG.ENABLE_DOM_MONITORING) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitoring);
  } else {
    startMonitoring();
  }
  
  // Also start monitoring after a short delay
  setTimeout(startMonitoring, 500);
}

// Listen for messages from background (optional - for future enhancements)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESET_MONITOR') {
    lastCodeSent = null;
    console.log('Monitor reset');
    sendResponse({ success: true });
  }
  return true;
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
});


const clickEvent = new MouseEvent('click', {
  view: window,
  bubbles: true,
  cancelable: true
});

// Create floating button to start auto-click
function createFloatingButton() {
  const button = document.createElement('button');
  button.id = 'technolife-auto-click-btn';
  button.innerHTML = '🚀 Start Auto-Click';
  
  // Styling
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '99999',
    padding: '12px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease'
  });
  
  // Right-click to add invalid code
  button.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const code = prompt('کد نامعتبر را وارد کنید:\n(این کد به لیست کدهای نادیده گرفته شده اضافه می‌شود)');
    if (code && code.trim() !== '') {
      const trimmedCode = code.trim();
      if (!CONFIG.INVALID_CODES.includes(trimmedCode)) {
        CONFIG.INVALID_CODES.push(trimmedCode);
        alert(`✅ کد "${trimmedCode}" به لیست کدهای نامعتبر اضافه شد\n\nلیست فعلی:\n${CONFIG.INVALID_CODES.join(', ')}`);
        console.log('Invalid codes updated:', CONFIG.INVALID_CODES);
      } else {
        alert(`⚠️ کد "${trimmedCode}" قبلاً در لیست موجود است`);
      }
    }
  });
  
  let autoClickInterval = null;
  let isActive = false;
  
  button.addEventListener('click', () => {
    isActive = !isActive;
    
    if (isActive) {
      // Start auto-click
      button.innerHTML = '⏸️ Stop Auto-Click';
      button.style.backgroundColor = '#f44336';
      
      autoClickInterval = setInterval(() => {
        const targetButton = document.querySelectorAll("button[type='button']")?.[0];
        targetButton?.classList?.remove("disabled:cursor-not-allowed");
        targetButton?.classList?.remove("disabled:opacity-50");
        targetButton?.removeAttribute("disabled");
        targetButton?.dispatchEvent(clickEvent);
      }, 50);
      
      console.log('✅ Auto-click started');
    } else {
      // Stop auto-click
      button.innerHTML = '🚀 Start Auto-Click';
      button.style.backgroundColor = '#4CAF50';
      
      if (autoClickInterval) {
        clearInterval(autoClickInterval);
        autoClickInterval = null;
      }
      
      console.log('⏸️ Auto-click stopped');
    }
  });
  
  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
  });
  
  document.body.appendChild(button);
  
  // ==================== DYNAMIC PASSWORD INPUT ====================
  const passInput = document.createElement('input');
  passInput.type = 'text';
  passInput.placeholder = 'رمز دوم (پویا)';
  passInput.id = 'technolife-dynamic-pass';
  
  Object.assign(passInput.style, {
    position: 'fixed',
    bottom: '70px', // Above the button
    right: '20px',
    zIndex: '99999',
    padding: '10px',
    width: '140px',
    backgroundColor: 'white',
    color: '#333',
    border: '2px solid #4CAF50',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  });

  // Load saved password if any (optional, mostly for testing)
  chrome.storage.local.get(['dynamicPassword'], (result) => {
    if (result.dynamicPassword) {
      passInput.value = result.dynamicPassword;
    }
  });

  // Save on input
  passInput.addEventListener('input', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ 'dynamicPassword': val }, () => {
      console.log('رمز دوم ذخیره شد:', val);
      
      // Visual feedback
      passInput.style.borderColor = '#4CAF50'; // Green border
      passInput.style.backgroundColor = '#e8f5e9'; // Light green background
      
      // Reset background after 300ms
      setTimeout(() => {
        passInput.style.backgroundColor = 'white';
      }, 300);
    });
  });

  document.body.appendChild(passInput);
  // ================================================================

  console.log('✅ Floating button created');
}

// Wait for body to be available then create button
if (document.body) {
  createFloatingButton();
} else {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
}
