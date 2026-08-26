/**
 * Standardized API response helpers.
 */

const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'Something went wrong', statusCode = 500, errorCode = null) => {
  const response = {
    success: false,
    message,
  };
  if (errorCode) {
    response.error = errorCode;
  }
  return res.status(statusCode).json(response);
};

const paginated = (res, data, total, page, limit, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, error, paginated };
