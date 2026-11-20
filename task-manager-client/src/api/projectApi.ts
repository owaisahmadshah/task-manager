import type {
  AddProjectMemberPayload,
  CreateProjectPayload,
  ProjectDetail,
  ProjectMember,
  ProjectSummary,
  UpdateMemberRolePayload,
  UpdateProjectPayload,
} from '../types/project';
import { apiClient } from './client';

export const projectApi = {
  async list(): Promise<ProjectSummary[]> {
    const { data } = await apiClient.get<ProjectSummary[]>('/projects');
    return data;
  },

  async getById(projectId: number): Promise<ProjectDetail> {
    const { data } = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
    return data;
  },

  async create(payload: CreateProjectPayload): Promise<ProjectSummary> {
    const { data } = await apiClient.post<ProjectSummary>('/projects', payload);
    return data;
  },

  async update(projectId: number, payload: UpdateProjectPayload): Promise<ProjectSummary> {
    const { data } = await apiClient.put<ProjectSummary>(`/projects/${projectId}`, payload);
    return data;
  },

  async remove(projectId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  async addMember(projectId: number, payload: AddProjectMemberPayload): Promise<ProjectMember> {
    const { data } = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, payload);
    return data;
  },

  async updateMemberRole(
    projectId: number,
    memberId: number,
    payload: UpdateMemberRolePayload
  ): Promise<ProjectMember> {
    const { data } = await apiClient.patch<ProjectMember>(
      `/projects/${projectId}/members/${memberId}`,
      payload
    );
    return data;
  },

  async removeMember(projectId: number, memberId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
  },
};
