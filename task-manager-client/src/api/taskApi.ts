import type {
  AssigneeUpdateResponse,
  CreateCommentPayload,
  CreateTagPayload,
  CreateTaskPayload,
  StatusUpdateResponse,
  Tag,
  TaskComment,
  TaskDetail,
  TaskFilters,
  TaskListItem,
  TaskStatus,
  UpdateTaskPayload,
} from '../types/task';
import { apiClient } from './client';

export const taskApi = {
  async listByProject(projectId: number, filters?: TaskFilters): Promise<TaskListItem[]> {
    const params: Record<string, string | number> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.assigneeId !== undefined && filters.assigneeId !== '') {
      params.assigneeId = filters.assigneeId;
    }
    if (filters?.tagId !== undefined && filters.tagId !== '') {
      params.tagId = filters.tagId;
    }

    const { data } = await apiClient.get<TaskListItem[]>(`/projects/${projectId}/tasks`, { params });
    return data;
  },

  async create(projectId: number, payload: CreateTaskPayload): Promise<TaskDetail> {
    const { data } = await apiClient.post<TaskDetail>(`/projects/${projectId}/tasks`, payload);
    return data;
  },

  async getById(taskId: number): Promise<TaskDetail> {
    const { data } = await apiClient.get<TaskDetail>(`/tasks/${taskId}`);
    return data;
  },

  async update(taskId: number, payload: UpdateTaskPayload): Promise<TaskDetail> {
    const { data } = await apiClient.put<TaskDetail>(`/tasks/${taskId}`, payload);
    return data;
  },

  async updateStatus(taskId: number, status: TaskStatus): Promise<StatusUpdateResponse> {
    const { data } = await apiClient.patch<StatusUpdateResponse>(`/tasks/${taskId}/status`, {
      status,
    });
    return data;
  },

  async updateAssignee(
    taskId: number,
    assigneeId: number | null
  ): Promise<AssigneeUpdateResponse> {
    const { data } = await apiClient.patch<AssigneeUpdateResponse>(`/tasks/${taskId}/assignee`, {
      assigneeId,
    });
    return data;
  },

  async remove(taskId: number): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  async assignTag(taskId: number, tagId: number): Promise<void> {
    await apiClient.post(`/tasks/${taskId}/tags`, { tagId });
  },

  async removeTag(taskId: number, tagId: number): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/tags/${tagId}`);
  },

  async addComment(taskId: number, payload: CreateCommentPayload): Promise<TaskComment> {
    const { data } = await apiClient.post<TaskComment>(`/tasks/${taskId}/comments`, payload);
    return data;
  },

  async listTags(): Promise<Tag[]> {
    const { data } = await apiClient.get<Tag[]>('/tags');
    return data;
  },

  async createTag(payload: CreateTagPayload): Promise<Tag> {
    const { data } = await apiClient.post<Tag>('/tags', payload);
    return data;
  },
};
