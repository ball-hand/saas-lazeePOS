// backend/middleware/pagination.js
export function pagination(req, res, next) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;

  // Set limits to prevent abuse
  const maxLimit = 100;
  const finalLimit = limit > maxLimit ? maxLimit : limit;
  const skip = (page - 1) * finalLimit;

  req.pagination = {
    skip,
    take: finalLimit,
    page,
    limit: finalLimit,
  };

  next();
}
