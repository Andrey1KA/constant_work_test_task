import type { Dayjs } from 'dayjs';
import type { Nullable } from '@/types/utility';

export type DayjsOrNull = Nullable<Dayjs>;

export type DayjsDateTuple = [Dayjs, Dayjs];

export type TaskBoardDateRange = Nullable<DayjsDateTuple>;

export type DayjsNullableTuple = [DayjsOrNull, DayjsOrNull];

export type DayjsRangePickerChangeValue = Nullable<DayjsNullableTuple>;
