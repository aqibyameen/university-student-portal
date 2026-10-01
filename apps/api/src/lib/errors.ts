export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  badRequest: (msg: string, code = 'BAD_REQUEST') => new AppError(400, code, msg),
  unauthorized: (msg = 'Authentication required.') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'You do not have permission to perform this action.') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (entity: string) => new AppError(404, `${entity.toUpperCase().replace(' ', '_')}_NOT_FOUND`, `${entity} not found.`),
  conflict: (msg: string) => new AppError(409, 'CONFLICT', msg),
  validation: (details: unknown) => new AppError(422, 'VALIDATION_ERROR', 'Validation failed.', details),
  internal: (msg = 'An internal server error occurred.') => new AppError(500, 'INTERNAL_ERROR', msg),
};
