/**
 * Maps backend/database errors to a safe user-facing message while preserving the
 * full diagnostic detail in the console for developers. Errors are never swallowed.
 */

interface DbLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  status?: number;
}

const CODE_MESSAGES: Record<string, string> = {
  '23505': 'That record already exists.',
  '23503': 'A related record is missing, so this could not be saved.',
  '23502': 'A required field was missing.',
  '42501': 'You do not have permission to do that. Try signing in again.',
  '42P01': 'This feature is temporarily unavailable. Please try again shortly.',
  PGRST301: 'Your session expired. Please sign in again.',
};

export function mapDbError(error: unknown, context: string): string {
  const err = (error ?? {}) as DbLikeError;
  // Keep the real cause visible to developers, including status/details/hint.
  console.error(`[${context}]`, {
    code: err.code,
    status: err.status,
    message: err.message,
    details: err.details,
    hint: err.hint,
    raw: error,
  });

  if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
  if (err.status === 401 || err.status === 403) {
    return 'You are not authorised for that action. Please sign in again.';
  }
  if (typeof err.message === 'string' && /fetch|network|failed to/i.test(err.message)) {
    return 'We could not reach the server. Check your connection and try again.';
  }
  return 'Something went wrong on our side. Please try again in a moment.';
}

export function isUniqueViolation(error: unknown): boolean {
  return (error as DbLikeError)?.code === '23505';
}
