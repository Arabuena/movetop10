const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  console.log('📥 Requisição recebida:', {
    method: req.method,
    url: req.url,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  // Interceptar a resposta
  const oldSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    console.log('📤 Resposta enviada:', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    oldSend.apply(res, arguments);
  };

  next();
};

module.exports = requestLogger; 