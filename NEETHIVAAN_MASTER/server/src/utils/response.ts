// path: server/src/utils/response.ts
// Standardised API response builders.
// Every endpoint uses these — no raw res.json() calls scattered around.

import { Response } from 'express';

export function successResponse<T>(
  res:        Response,
  data:       T,
  message    = 'Success',
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  res:        Response,
  message:    string,
  statusCode = 400,
  error?:     unknown
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error ? { error: String(error) } : {}),
  });
}

export function paginatedResponse<T>(
  res:   Response,
  items: T[],
  total: number,
  page:  number,
  limit: number,
  message = 'Success'
): Response {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      total,
      page,
      pages:   Math.ceil(total / limit),
      limit,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
