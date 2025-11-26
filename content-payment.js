// Content script for payment page
// This script receives the verification code and inserts it into the input field

// ==================== CONFIG - EDIT THESE SELECTORS ====================
const CONFIG = {
  // TODO: Replace with actual input selector from payment page
  // Example: 'input[name="verification_code"]' or 'input#payment-code' or '.payment-input'
  CODE_INPUT_SELECTOR: 'input[name="code"]',
  
  // TODO: Replace with actual submit button selector from payment page
  // Example: 'button[type="submit"]' or 'button.submit-btn' or '#submit-code-btn'
  SUBMIT_BUTTON_SELECTOR: 'button[type="submit"]',
  
  // Delay before clicking submit button (milliseconds)
  // Minimum recommended: 50ms (balance between speed and reliability)
  // If page uses React/Vue: 100ms safer
  // Plain HTML form: can try 30ms
  SUBMIT_DELAY_MS: 50
};
// =======================================================================

console.log('Payment content script loaded');

let codeInserted = false;

// Function to insert code into input and submit
function insertCodeAndSubmit(code) {
  if (codeInserted) {
    console.log('Code already inserted, skipping');
    return;
  }
  
  const codeInput = document.querySelector(CONFIG.CODE_INPUT_SELECTOR);
  
  if (codeInput) {
    // Insert the code
    codeInput.value = code;
    
    // Trigger input event to ensure the page recognizes the change
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    codeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('Code inserted:', code);
    
    // Short delay to ensure the value is set, then click submit button
    setTimeout(() => {
      
      const submitButton = document.querySelector(CONFIG.SUBMIT_BUTTON_SELECTOR);
      
      if (submitButton) {
        submitButton.click();
        console.log('Submit button clicked');
        codeInserted = true;
        
        // Notify background that code was inserted
        chrome.runtime.sendMessage({
          type: 'CODE_INSERTED',
          success: true
        });
      } else {
        console.warn('Submit button not found. Selector:', CONFIG.SUBMIT_BUTTON_SELECTOR);
      }
      
    }, CONFIG.SUBMIT_DELAY_MS); // 100ms delay for minimal latency while ensuring reliability
    
  } else {
    console.warn('Code input field not found. Selector:', CONFIG.CODE_INPUT_SELECTOR);
  }
}

// Request code from background when page loads
function requestCode() {
  chrome.runtime.sendMessage({
    type: 'REQUEST_CODE'
  }, (response) => {
    if (response && response.success && response.code) {
      console.log('Code received from background:', response.code);
      insertCodeAndSubmit(response.code);
    } else {
      console.log('No code available yet, waiting for message...');
    }
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INSERT_CODE' && message.code) {
    console.log('Received INSERT_CODE message:', message.code);
    insertCodeAndSubmit(message.code);
    sendResponse({ success: true });
  }
  return true;
});

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', requestCode);
} else {
  requestCode();
}

// Also try after a short delay to ensure page is ready
setTimeout(requestCode, 300);
