// Content script for Payment Gateways (starting with PEC/Parsian)
// https://pec.shaparak.ir/

// ==================== CARD CONFIGURATION ====================
// اطلاعات کارت از Storage خوانده می‌شود
const CARD_INFO = {
  cardNumber: '',
  cvv2: '',
  expMonth: '',
  expYear: '',
  secondPassword: '',
  dummyCaptcha: '11111'
};
// ============================================================

console.log('Payment gateway script loaded');

// Helper function to set input value and trigger events
function setInputValue(elementOrSelector, value) {
  const input = typeof elementOrSelector === 'string' 
    ? document.querySelector(elementOrSelector) 
    : elementOrSelector;
    
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    console.log(`Filled ${input.id || input.name} with value length: ${value.length}`);
  } else {
    console.warn(`Element not found: ${elementOrSelector}`);
  }
}

// ==================== GATEWAY LOGIC ====================

// 1. PARSIAN (PEC)
function isParsianGateway() {
  try {
    const paymentWrp = document.getElementById('paymentwrp');
    const panInput = document.getElementById('pan');
    const contactUs = document.getElementsByClassName('contactus-lg')?.[0];

    const condition1 = paymentWrp && paymentWrp.innerHTML.includes('پرداخت اینترنتی تجارت الکترونیک پارسیان');
    const condition2 = !!panInput;
    const condition3 = contactUs && contactUs.innerHTML.includes('۲۳۱۸ - ۰۲۱');

    const isMatch = condition1 && condition2 && condition3;
    if (isMatch) console.log('✅ Parsian Gateway Detected');
    return isMatch;
  } catch (e) {
    console.error('Error detecting Parsian gateway:', e);
    return false;
  }
}

function fillParsianGateway() {
  console.log('🚀 Starting auto-fill for Parsian...');
  
  // 1. Card Number
  setInputValue('#pan', CARD_INFO.cardNumber);
  
  // 2. CVV2
  setInputValue('#cvv2', CARD_INFO.cvv2);
  
  // 3. Expiration Month
  setInputValue('#txtExpM', CARD_INFO.expMonth);
  
  // 4. Expiration Year
  setInputValue('#txtExpY', CARD_INFO.expYear);
  
  // 5. Dummy Captcha
  setInputValue('#Captcha', CARD_INFO.dummyCaptcha);
  
  // 6. Second Password
  setInputValue('#pin2', CARD_INFO.secondPassword);
  
  // 7. Setup Enter key listener for payment
  console.log('⌨️ Waiting for Enter key to submit...');
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const payBtn = document.getElementById('btnPayment');
      if (payBtn) {
        console.log('⚡ Enter pressed, clicking payment button...');
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        payBtn.dispatchEvent(clickEvent);
      } else {
        console.error('Payment button not found!');
      }
    }
  });
}

// 2. BEHPARDAKHT (BPM)
function isBehpardakhtGateway() {
  try {
    return document.getElementsByClassName("beh-card").length > 0;
  } catch (e) {
    console.error('Error detecting Behpardakht gateway:', e);
    return false;
  }
}

function fillBehpardakhtGateway() {
  console.log('🚀 Starting auto-fill for Behpardakht...');
  
  // 1. Card Number
  setInputValue('#cardnumber', CARD_INFO.cardNumber);
  
  // 2. CVV2
  setInputValue('#inputcvv2', CARD_INFO.cvv2);
  
  // 3. Expiration Month
  setInputValue('#inputmonth', CARD_INFO.expMonth);
  
  // 4. Expiration Year
  setInputValue('#inputyear', CARD_INFO.expYear);
  
  // 5. Second Password
  setInputValue('#inputpin', CARD_INFO.secondPassword);
  
  // 6. Setup Enter key listener for payment
  console.log('⌨️ Waiting for Enter key to submit...');
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      // Try to find the button (assuming id="payButton" based on inputpin's onkeyup)
      const payBtn = document.getElementById('payButton') || document.querySelector('button[type="submit"]');
      
      if (payBtn) {
        console.log('⚡ Enter pressed, clicking payment button...');
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        payBtn.dispatchEvent(clickEvent);
      } else {
        console.error('Payment button not found!');
      }
    }
  });
}

// Gateway Definitions
const GATEWAYS = [
  {
    name: 'PARSIAN',
    check: isParsianGateway,
    action: fillParsianGateway
  },
  {
    name: 'BEHPARDAKHT',
    check: isBehpardakhtGateway,
    action: fillBehpardakhtGateway
  }
  // Add more gateways here in the future
];

// Main function to check and execute
function checkAndFillGateways() {
  // Get all settings from storage
  chrome.storage.local.get(['dynamicPassword', 'cardInfo'], (result) => {
    // 1. Load Dynamic Password
    if (result.dynamicPassword) {
      console.log('✅ Dynamic password retrieved');
      CARD_INFO.secondPassword = result.dynamicPassword;
    } else {
      console.warn('⚠️ No dynamic password found');
    }

    // 2. Load Card Info
    if (result.cardInfo) {
      console.log('✅ Card info retrieved');
      CARD_INFO.cardNumber = result.cardInfo.cardNumber || '';
      CARD_INFO.cvv2 = result.cardInfo.cvv2 || '';
      CARD_INFO.expMonth = result.cardInfo.expMonth || '';
      CARD_INFO.expYear = result.cardInfo.expYear || '';
    } else {
      console.warn('⚠️ No card info found in storage');
    }

    // Then proceed with gateway checks
    for (const gateway of GATEWAYS) {
      if (gateway.check()) {
        console.log(`🎯 Gateway matched: ${gateway.name}`);
        gateway.action();
        break; // Stop after finding the first matching gateway
      }
    }
  });
}

// Run immediately and on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndFillGateways);
} else {
  checkAndFillGateways();
}

// Retry mechanism (in case of dynamic rendering)
setTimeout(checkAndFillGateways, 500);
setTimeout(checkAndFillGateways, 1500);
