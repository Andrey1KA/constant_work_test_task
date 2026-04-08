export type TaskStatusPending = 'PENDING';
export type TaskStatusInProgress = 'IN_PROGRESS';
export type TaskStatusDone = 'DONE';

export type TaskStatus =
  | TaskStatusPending
  | TaskStatusInProgress
  | TaskStatusDone;
