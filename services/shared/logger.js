const createLogger = (serviceName) => {
  return {
    info: (message, details = {}) => {
      console.log(JSON.stringify({
        service: serviceName,
        level: "info",
        message,
        ...details,
        timestamp: new Date().toISOString()
      }));
    },
    error: (message, details = {}) => {
      console.error(JSON.stringify({
        service: serviceName,
        level: "error",
        message,
        ...details,
        timestamp: new Date().toISOString()
      }));
    }
  };
};

module.exports = createLogger;
