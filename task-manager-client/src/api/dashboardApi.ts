import type { DashboardOverview, UserWorkload } from '../types/dashboard';
import { apiClient } from './client';

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const { data } = await apiClient.get<DashboardOverview>('/dashboard/overview');
    return data;
  },

  async getWorkload(): Promise<UserWorkload[]> {
    const { data } = await apiClient.get<UserWorkload[]>('/dashboard/workload');
    return data;
  },
};
