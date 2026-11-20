export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';
export type ProjectRole = 'Admin' | 'Project Manager' | 'Member';

export interface ProjectSummary {
  projectId: number;
  projectName: string;
  description: string | null;
  ownerId: number;
  ownerName: string;
  deadline: string;
  status: ProjectStatus;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface ProjectMember {
  userId: number;
  fullName: string;
  email: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  members: ProjectMember[];
}

export interface CreateProjectPayload {
  projectName: string;
  description?: string | null;
  deadline: string;
}

export interface UpdateProjectPayload {
  projectName: string;
  description?: string | null;
  deadline: string;
  status: ProjectStatus;
}

export interface AddProjectMemberPayload {
  email: string;
  role: ProjectRole;
}

export interface UpdateMemberRolePayload {
  role: ProjectRole;
}
