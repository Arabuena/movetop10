const logger = {
  logHistory: [],

  log: (...args) => {
    console.log('[Move]', ...args);
    logger.logHistory.push({
      type: 'log',
      message: args,
      timestamp: new Date()
    });
  },

  error: (...args) => {
    console.error('[Move Error]', ...args);
    logger.logHistory.push({
      type: 'error',
      message: args,
      timestamp: new Date()
    });
  },

  warn: (...args) => {
    console.warn('[Move Warning]', ...args);
    logger.logHistory.push({
      type: 'warn',
      message: args,
      timestamp: new Date()
    });
  },

  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Move Debug]', ...args);
      logger.logHistory.push({
        type: 'debug',
        message: args,
        timestamp: new Date()
      });
    }
  },

  checkEnvironment: () => {
    const env = {
      isAndroid: /Android/.test(navigator.userAgent),
      isWebView: !!window.ReactNativeWebView,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: navigator.connection?.type || 'unknown'
    };

    logger.debug('Environment check:', env);
    return env;
  },

  showLogsInUI: () => {
    const logsDiv = document.createElement('div');
    logsDiv.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 200px;
      background: rgba(0,0,0,0.8);
      color: white;
      overflow: auto;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      z-index: 9999;
    `;

    const logs = logger.logHistory
      .map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.type}: ${JSON.stringify(log.message)}`)
      .join('\n');
    
    logsDiv.textContent = logs;
    document.body.appendChild(logsDiv);
  }
};

logger.checkEnvironment();

window.addEventListener('error', (event) => {
  logger.error('Uncaught error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  });
});

export default logger; 