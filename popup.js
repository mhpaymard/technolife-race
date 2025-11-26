// Popup script for showing extension status

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const statusTextEl = document.getElementById('statusText');
  const codeDisplayEl = document.getElementById('codeDisplay');
  const clearBtn = document.getElementById('clearBtn');
  
  // Check for active tabs
  function checkStatus() {
    chrome.tabs.query({}, (tabs) => {
      const timeTunnelTab = tabs.find(tab => 
        tab.url && tab.url.includes('cmp.technolife.com/time-tunnel')
      );
      const paymentTab = tabs.find(tab => 
        tab.url && tab.url.includes('www.technolife.com/payment')
      );
      
      if (timeTunnelTab && paymentTab) {
        statusTextEl.textContent = '✅ هر دو صفحه فعال است';
        statusEl.className = 'status active';
      } else if (timeTunnelTab) {
        statusTextEl.textContent = '⚠️ فقط صفحه time-tunnel فعال است';
        statusEl.className = 'status';
      } else if (paymentTab) {
        statusTextEl.textContent = '⚠️ فقط صفحه payment فعال است';
        statusEl.className = 'status';
      } else {
        statusTextEl.textContent = '❌ هیچ صفحه‌ای فعال نیست';
        statusEl.className = 'status';
      }
    });
  }
  
  // Request current code from background
  chrome.runtime.sendMessage({ type: 'REQUEST_CODE' }, (response) => {
    if (response && response.code) {
      codeDisplayEl.textContent = response.code;
    }
  });
  
  // Clear button handler
  clearBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_CODE' }, () => {
      codeDisplayEl.textContent = 'منتظر کد...';
      alert('کد پاک شد');
    });
  });
  
  // Initial check
  checkStatus();
  
  // Refresh status every 2 seconds
  setInterval(checkStatus, 2000);
});
