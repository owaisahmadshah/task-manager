import type { ProjectSummary } from './project';

export interface UserWorkload {
  userId: number;
  fullName: string;
  email: string;
  assignedTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
}

export interface DashboardOverview {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  projects: ProjectSummary[];
  teamWorkload: UserWorkload[];
}
