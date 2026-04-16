function createLogger(serviceName) {
  return {
    info: (message, meta = {}) => {
      console.log(JSON.stringify({
        level: "info",
        service: serviceName,
        message,
        ...meta,
        timestamp: new Date().toISOString()
      }));
    },
    error: (message, meta = {}) => {
      console.error(JSON.stringify({
        level: "error",
        service: serviceName,
        message,
        ...meta,
        timestamp: new Date().toISOString()
      }));
    }
  };
}

module.exports = createLogger;
