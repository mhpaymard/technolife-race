// This script runs in the page context (MAIN world) to intercept XHR/Fetch
// It uses a custom event to communicate with content script (bypassing console.log issues)

(function() {
  'use strict';
  
  // Save original console.log IMMEDIATELY before page overwrites it
  const originalLog = console.log.bind(console);
  
  // Save original XHR and Fetch
  const OriginalXHR = window.XMLHttpRequest;
  const originalFetch = window.fetch;
  
  // Custom event for communication (bypass console.log)
  function sendToContentScript(data) {
    window.dispatchEvent(new CustomEvent('XHR_INTERCEPTED', {
      detail: data
    }));
  }
  
  // ==================== XHR INTERCEPTION ====================
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    let requestURL = '';
    
    xhr.open = function(method, url) {
      requestURL = url;
      return originalOpen.apply(this, arguments);
    };
    
    xhr.send = function() {
      this.addEventListener('load', function() {
        try {
          const response = JSON.parse(this.responseText);
          
          // Send to content script via custom event
          sendToContentScript({
            type: 'xhr',
            url: requestURL,
            response: response,
            status: this.status
          });
          
          // Also log with original console.log (if still works)
          // originalLog('[XHR INTERCEPTED]', requestURL, response); // Disabled to reduce console clutter
        } catch (e) {
          // Not JSON or error parsing
        }
      });
      
      return originalSend.apply(this, arguments);
    };
    
    return xhr;
  };
  
  // ==================== FETCH INTERCEPTION ====================
  window.fetch = function(...args) {
    const url = args[0];
    
    return originalFetch.apply(this, args).then(response => {
      // Clone response to read it
      const clonedResponse = response.clone();
      
      clonedResponse.json().then(data => {
        // Send to content script via custom event
        sendToContentScript({
          type: 'fetch',
          url: url,
          response: data,
          status: response.status
        });
        
        // Also log with original console.log
        // originalLog('[FETCH INTERCEPTED]', url, data); // Disabled to reduce console clutter
      }).catch(() => {
        // Not JSON response
      });
      
      return response;
    });
  };
  
  // originalLog('✅ XHR/Fetch interceptor injected successfully'); // Disabled to reduce console clutter
})();
