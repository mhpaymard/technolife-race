// Content script for time-tunnel page
// This script monitors for verification code in DOM

// ==================== CONFIG - EDIT THESE SELECTORS ====================
const CONFIG = {
  // Input selector for DOM monitoring
  CODE_INPUT_SELECTOR: 'span.border.border-dashed',
  
  // Check interval in milliseconds (50ms = very fast, 20 checks per second)
  CHECK_INTERVAL_MS: 50,
  
  // Stop monitoring after code is found and sent (true = more efficient)
  STOP_AFTER_SEND: true,
  
  // Invalid codes to ignore (continue searching if these values found)
  INVALID_CODES: ['631V3532KW', 'OIUYGS3547']
};
// =======================================================================

console.log('Time-tunnel content script loaded');

let lastCodeSent = null;
let checkInterval = null;

// Start monitoring DOM
function startMonitoring() {
  // Clear any existing interval
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  console.log('Starting DOM monitoring...');
  
  // Check every 50ms for the input element
  checkInterval = setInterval(() => {

    const codeInput = document.querySelectorAll(CONFIG.CODE_INPUT_SELECTOR)?.at(-1);

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

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}

// Also start monitoring after a short delay
setTimeout(startMonitoring, 500);

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

setTimeout(() => {
  setInterval(() => {
    const button = document.querySelectorAll("button[type='button']")?.[0];
    button?.classList?.remove("disabled:cursor-not-allowed");
    button?.classList?.remove("disabled:opacity-50");
    button?.removeAttribute("disabled");
    button?.dispatchEvent(clickEvent);
  }, 50);
}, 1000);
