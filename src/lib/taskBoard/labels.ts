import type { Priority, TaskStatus } from '@/types';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from './constants';

export function statusLabel(s: TaskStatus) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

export function priorityLabel(p: Priority) {
  return PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

export function priorityColor(p: Priority) {
  if (p === 'HIGH') return 'red';
  if (p === 'MEDIUM') return 'orange';
  return 'blue';
}
