import { httpError } from '../utils/httpError.js';

export const notFound = (req, res, next) => next(httpError(404, 'Not found.'));

/** Turns every error into a short JSON message. Internal details are logged, never sent. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let fields = err.fields;

  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation
    status = 400;
    message = 'Please fix the highlighted fields.';
    // form fields are named like the paths, except the links (live, code)
    fields = Object.fromEntries(Object.entries(err.errors).map(([path, e]) => [path.replace(/^links\./, ''), e.message]));
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Item not found.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Something with that URL id already exists. Please choose another.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'That is too large to upload.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request could not be read.';
  }

  if (status >= 500 && status !== 503) console.error(err);
  res.set('Cache-Control', 'no-store');
  res.status(status).json({
    error: status >= 500 && status !== 503 && status !== 502 ? 'Something went wrong on the server.' : message,
    ...(fields ? { fields } : {}),
  });
}
