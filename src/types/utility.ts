export type Nullable<T> = T | null;

/** Значение может отсутствовать (`undefined`). */
export type Optional<T> = T | undefined;

export type Maybe<T> = T | undefined;

export type Awaitable<T> = T | Promise<T>;
