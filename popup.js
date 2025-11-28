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
      // alert('کد پاک شد');
    });
  });

  // ==================== CARD SETTINGS ====================
  const cardNumberInput = document.getElementById('cardNumber');
  const cvv2Input = document.getElementById('cvv2');
  const expMonthInput = document.getElementById('expMonth');
  const expYearInput = document.getElementById('expYear');
  const saveCardBtn = document.getElementById('saveCardBtn');

  // Load saved settings
  chrome.storage.local.get(['cardInfo'], (result) => {
    if (result.cardInfo) {
      cardNumberInput.value = result.cardInfo.cardNumber || '';
      cvv2Input.value = result.cardInfo.cvv2 || '';
      expMonthInput.value = result.cardInfo.expMonth || '';
      expYearInput.value = result.cardInfo.expYear || '';
    }
  });

  // Save settings
  saveCardBtn.addEventListener('click', () => {
    const cardInfo = {
      cardNumber: cardNumberInput.value,
      cvv2: cvv2Input.value,
      expMonth: expMonthInput.value,
      expYear: expYearInput.value
    };

    chrome.storage.local.set({ 'cardInfo': cardInfo }, () => {
      const originalText = saveCardBtn.textContent;
      saveCardBtn.textContent = '✅ ذخیره شد!';
      saveCardBtn.style.background = '#388E3C';
      
      setTimeout(() => {
        saveCardBtn.textContent = originalText;
        saveCardBtn.style.background = '#4CAF50';
      }, 2000);
    });
  });
  // =======================================================
  
  // Initial check
  checkStatus();
  
  // Refresh status every 2 seconds
  setInterval(checkStatus, 2000);
});
