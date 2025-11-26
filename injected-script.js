// Injected script to intercept XHR requests and capture verification code
// This script runs in the page context (not extension context)

(function() {
  console.log('🔧 XHR interceptor injected into page context');
  
  // Save original XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  const originalOpen = originalXHR.prototype.open;
  const originalSend = originalXHR.prototype.send;
  
  // Override XMLHttpRequest
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    
    // Store original open
    xhr.open = function() {
      this._method = arguments[0];
      this._url = arguments[1];
      return originalOpen.apply(this, arguments);
    };
    
    // Override send to intercept response
    xhr.send = function() {
      // Add event listener for response
      this.addEventListener('readystatechange', function() {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const response = JSON.parse(this.responseText);
            
            console.log('📡 XHR Response intercepted:', this._url);
            
            // Check if response has the code we're looking for
            // Format: {data: {code: "XXXXX"}}
            if (response && response.data && response.data.code) {
              const code = response.data.code;
              console.log('✅ Verification code found in XHR response:', code);
              
              // Send code to content script via window.postMessage
              window.postMessage({
                type: 'TECHNOLIFE_CODE_FOUND',
                source: 'injected-script',
                code: code
              }, '*');
            }
          } catch (e) {
            // Response is not JSON or doesn't have expected structure
            // Silently ignore
          }
        }
      });
      
      return originalSend.apply(this, arguments);
    };
    
    return xhr;
  };
  
  // Also intercept fetch API
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clone response to read it
    const clonedResponse = response.clone();
    
    try {
      const data = await clonedResponse.json();
      
      console.log('📡 Fetch Response intercepted:', args[0]);
      
      // Check if response has the code
      if (data && data.data && data.data.code) {
        const code = data.data.code;
        console.log('✅ Verification code found in Fetch response:', code);
        
        // Send code to content script via window.postMessage
        window.postMessage({
          type: 'TECHNOLIFE_CODE_FOUND',
          source: 'injected-script',
          code: code
        }, '*');
      }
    } catch (e) {
      // Response is not JSON, ignore
    }
    
    return response;
  };
  
  console.log('🎯 XHR and Fetch interceptors ready');
})();
