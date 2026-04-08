export type TaskSortFieldDueDate = 'dueDate';
export type TaskSortFieldCreatedAt = 'createdAt';
export type TaskSortFieldPriority = 'priority';
export type TaskSortFieldStatus = 'status';
export type TaskSortFieldTitle = 'title';

export type TaskSortField =
  | TaskSortFieldDueDate
  | TaskSortFieldCreatedAt
  | TaskSortFieldPriority
  | TaskSortFieldStatus
  | TaskSortFieldTitle;
