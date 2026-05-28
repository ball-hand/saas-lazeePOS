export const responseTimeout = (timeMs = 30000) => {
  return (req, res, next) => {
    // Menggunakan timeout level socket dari Node.js / Express
    res.setTimeout(timeMs, () => {
      if (!res.headersSent) {
        res.status(408).json({ 
          message: 'Request Timeout: Server memakan waktu terlalu lama untuk memproses permintaan ini.' 
        });
      }
    });
    next();
  };
};
