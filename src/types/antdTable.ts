import type { Maybe } from '@/types/utility';

export type AntdColumnSortAscend = 'ascend';
export type AntdColumnSortDescend = 'descend';

export type AntdColumnSortOrder =
  | AntdColumnSortAscend
  | AntdColumnSortDescend;

export type TaskTableColumnSortOrder = Maybe<AntdColumnSortOrder>;
