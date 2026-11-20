export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface Tag {
  tagId: number;
  tagName: string;
  colorHex: string;
}

export interface TaskAuditLog {
  logId: number;
  taskId: number;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
}

export interface TaskComment {
  commentId: number;
  taskId: number;
  userId: number;
  authorName: string;
  commentText: string;
  createdAt: string;
}

export interface TaskListItem {
  taskId: number;
  projectId: number;
  assigneeId: number | null;
  assigneeName: string | null;
  parentTaskId: number | null;
  parentTaskTitle: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  tags: Tag[];
}

export interface TaskDetail extends TaskListItem {
  subtasks: TaskListItem[];
  comments: TaskComment[];
  auditLogs: TaskAuditLog[];
}

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  assigneeId?: number | '';
  tagId?: number | '';
}

export interface CreateTaskPayload {
  assigneeId?: number | null;
  parentTaskId?: number | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  tagIds?: number[] | null;
}

export interface UpdateTaskPayload {
  assigneeId?: number | null;
  parentTaskId?: number | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
}

export interface CreateCommentPayload {
  commentText: string;
}

export interface CreateTagPayload {
  tagName: string;
  colorHex: string;
}

export interface StatusUpdateResponse {
  taskId: number;
  status: TaskStatus;
  latestAudit: TaskAuditLog | null;
}

export interface AssigneeUpdateResponse {
  taskId: number;
  assigneeId: number | null;
  assigneeName: string | null;
}
