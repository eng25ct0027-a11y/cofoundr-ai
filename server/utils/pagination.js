function getPagination(query, defaults = {}) {
  const page = Math.max(1, Number(query.page) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaults.limit || 12));
  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  };
}

module.exports = { getPagination, paginationMeta };
