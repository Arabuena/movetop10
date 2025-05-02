export const isWebView = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('wv') || userAgent.includes('webview');
};

export const setupWebView = () => {
  if (isWebView()) {
    // Configurações específicas para WebView
    console.log('Running in WebView mode');
    
    // Prevenir erros comuns de WebView
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('WebView Error:', {
        message: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error
      });
      return false;
    };

    // Adicionar classe específica para WebView no body
    document.body.classList.add('webview');
  }
}; 