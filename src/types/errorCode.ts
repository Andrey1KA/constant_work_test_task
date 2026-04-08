export type ErrorCodeValidation = 'VALIDATION_ERROR';
export type ErrorCodeNotFound = 'NOT_FOUND';
export type ErrorCodeLlm = 'LLM_ERROR';
export type ErrorCodeRateLimit = 'RATE_LIMIT_EXCEEDED';
export type ErrorCodeInternal = 'INTERNAL_ERROR';

export type ErrorCode =
  | ErrorCodeValidation
  | ErrorCodeNotFound
  | ErrorCodeLlm
  | ErrorCodeRateLimit
  | ErrorCodeInternal;
