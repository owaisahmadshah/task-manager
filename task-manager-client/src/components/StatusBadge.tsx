import type { ProjectStatus } from '../types/project';
import type { TaskStatus } from '../types/task';

type BadgeStatus = TaskStatus | ProjectStatus;

const badgeStyles: Record<BadgeStatus, string> = {
  'To Do': 'bg-slate-100 text-slate-700 border-slate-200',
  'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
  'In Review': 'bg-amber-50 text-amber-700 border-amber-200',
  Done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyles[status]}`}
    >
      {status}
    </span>
  );
}
