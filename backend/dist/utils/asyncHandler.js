/**
 * Wraps async route handlers so that any rejected promise
 * is automatically forwarded to Express' global error handler.
 *
 * Without this helper, every controller would need its own
 * try/catch block that simply calls next(error).
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
export default asyncHandler;
