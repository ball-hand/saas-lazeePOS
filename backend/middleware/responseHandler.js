// backend/middleware/responseHandler.js
export function responseHandler(req, res, next) {
  // Override res.json to wrap standard API envelope if it doesn't already have one
  const originalJson = res.json;

  res.json = function (data) {
    if (data && data.status) {
      // Already has a standard wrapper, just send it
      return originalJson.call(this, data);
    }

    const envelope = {
      status: res.statusCode >= 400 ? 'error' : 'success',
      ...(res.statusCode >= 400 && data && data.message ? { message: data.message } : {}),
      data: (res.statusCode >= 400 && data && data.message) ? undefined : data,
    };

    return originalJson.call(this, envelope);
  };

  next();
}
