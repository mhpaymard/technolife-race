// Content script for time-tunnel page
// This script monitors for verification code in DOM

// ==================== CONFIG - EDIT THESE SELECTORS ====================
const CONFIG = {
  // Input selector for DOM monitoring
  CODE_INPUT_SELECTOR: 'span.border.border-dashed',

  // Check interval in milliseconds (25ms = very fast, 40 checks per second)
  CHECK_INTERVAL_MS: 25,
  
  // Stop monitoring after code is found and sent (true = more efficient)
  STOP_AFTER_SEND: true,
  
  // Invalid codes to ignore (continue searching if these values found)
  INVALID_CODES: ['631V3532KW', 'OIUYGS3547',"LSWEIB6514"]
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
  console.log('✅ Floating button created');
}

// Wait for body to be available then create button
if (document.body) {
  createFloatingButton();
} else {
  document.addEventListener('DOMContentLoaded', createFloatingButton);
}
