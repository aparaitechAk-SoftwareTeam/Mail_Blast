const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = 'Error', errors = [], statusCode = 400) => {
  const formattedErrors = Array.isArray(errors) 
    ? errors 
    : typeof errors === 'string' 
      ? [{ message: errors }] 
      : [errors];

  return res.status(statusCode).json({
    success: false,
    message,
    errors: formattedErrors
  });
};

module.exports = { sendSuccess, sendError };
