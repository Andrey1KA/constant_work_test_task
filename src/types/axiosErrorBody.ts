import type { Maybe } from '@/types/utility';

export type ApiErrorMessageBody = {
  error?: {
    message?: string;
  };
};

export type ApiErrorResponseData = Maybe<ApiErrorMessageBody>;
