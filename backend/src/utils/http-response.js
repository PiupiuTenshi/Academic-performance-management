export function sendSuccess(res, data = null, message = "OK", statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

