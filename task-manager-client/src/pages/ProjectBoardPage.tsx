import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getApiErrorMessage } from '../api/client';
import { projectApi } from '../api/projectApi';
import { taskApi } from '../api/taskApi';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ManageMembersModal } from '../components/ManageMembersModal';
import { PriorityBadge } from '../components/PriorityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useAuth } from '../context/AuthContext';
import type { ProjectDetail, ProjectRole, ProjectStatus } from '../types/project';
import type {
  Tag,
  TaskFilters,
  TaskListItem,
  TaskPriority,
  TaskStatus,
} from '../types/task';

const TASK_STATUSES: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const PROJECT_STATUSES: ProjectStatus[] = ['Active', 'On Hold', 'Completed'];

export function ProjectBoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericProjectId = Number(projectId);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    status: '',
    priority: '',
    assigneeId: '',
    tagId: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editDeadline, setEditDeadline] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const loadProjectAndTags = useCallback(async () => {
    if (!numericProjectId) return;
    const [detail, allTags] = await Promise.all([
      projectApi.getById(numericProjectId),
      taskApi.listTags(),
    ]);
    setProject(detail);
    setTags(allTags);
    setEditName(detail.projectName);
    setEditDesc(detail.description ?? '');
    setEditStatus(detail.status);
    setEditDeadline(detail.deadline.slice(0, 16));
  }, [numericProjectId]);

  const loadTasks = useCallback(async () => {
    if (!numericProjectId) return;
    const list = await taskApi.listByProject(numericProjectId, filters);
    setTasks(list);
  }, [numericProjectId, filters]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadProjectAndTags();
        if (active) await loadTasks();
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Failed to load project.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [loadProjectAndTags, loadTasks]);

  const currentUserRole: ProjectRole | null =
    project?.members.find((m) => m.userId === user?.userId)?.role ?? null;

  const canEditProject = currentUserRole === 'Admin' || currentUserRole === 'Project Manager';
  const canDeleteProject = currentUserRole === 'Admin';
  const canDeleteTask = currentUserRole === 'Admin' || currentUserRole === 'Project Manager';

  const handleStatusChange = async (taskId: number, nextStatus: TaskStatus) => {
    try {
      setError(null);
      await taskApi.updateStatus(taskId, nextStatus);
      await Promise.all([loadTasks(), loadProjectAndTags()]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update task status.'));
    }
  };

  const handleAssigneeChange = async (taskId: number, nextAssigneeValue: string) => {
    try {
      setError(null);
      const nextId = nextAssigneeValue ? Number(nextAssigneeValue) : null;
      await taskApi.updateAssignee(taskId, nextId);
      await loadTasks();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update assignee.'));
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setError(null);
      await taskApi.remove(taskId);
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      await Promise.all([loadTasks(), loadProjectAndTags()]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete task.'));
    }
  };

  const handleSaveProject = async () => {
    if (!project) return;
    setSavingProject(true);
    setError(null);
    try {
      await projectApi.update(project.projectId, {
        projectName: editName.trim(),
        description: editDesc.trim() ? editDesc.trim() : null,
        status: editStatus,
        deadline: new Date(editDeadline).toISOString(),
      });
      setEditingProject(false);
      await loadProjectAndTags();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update project.'));
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    try {
      setError(null);
      await projectApi.remove(project.projectId);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete project.'));
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500 py-8">Loading project workspace...</div>;
  }

  if (!project) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
        {error || 'Project not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        {editingProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {PROJECT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Deadline</label>
                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProject(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingProject}
                onClick={handleSaveProject}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg cursor-pointer"
              >
                {savingProject ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-slate-900">{project.projectName}</h1>
                <StatusBadge status={project.status} />
                {currentUserRole && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {currentUserRole}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-slate-500 mt-1">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                <span>Owner: {project.ownerName}</span>
                <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                <span>
                  Progress: {project.completedTasks}/{project.totalTasks} done
                </span>
                {project.overdueTasks > 0 && (
                  <span className="text-rose-600 font-medium">
                    {project.overdueTasks} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setMembersModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Members ({project.members.length})
              </button>
              {canEditProject && (
                <button
                  type="button"
                  onClick={() => setEditingProject(true)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Edit
                </button>
              )}
              {canDeleteProject && (
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="px-4 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                + Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value as TaskStatus | '' }))
          }
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.priority ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, priority: e.target.value as TaskPriority | '' }))
          }
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={filters.assigneeId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              assigneeId: e.target.value ? Number(e.target.value) : '',
            }))
          }
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Assignees</option>
          {project.members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.fullName}
            </option>
          ))}
        </select>

        <select
          value={filters.tagId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              tagId: e.target.value ? Number(e.target.value) : '',
            }))
          }
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Tags</option>
          {tags.map((t) => (
            <option key={t.tagId} value={t.tagId}>
              {t.tagName}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setFilters({ status: '', priority: '', assigneeId: '', tagId: '' })}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          No tasks match the current filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Due Date</th>
                  {canDeleteTask && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks.map((task) => (
                  <tr key={task.taskId} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(task.taskId)}
                        className="font-medium text-slate-900 hover:underline text-left cursor-pointer"
                      >
                        {task.title}
                      </button>
                      {task.parentTaskTitle && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Subtask of: {task.parentTaskTitle}
                        </div>
                      )}
                      {task.description && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.taskId, e.target.value as TaskStatus)
                        }
                        className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-md bg-white"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={task.assigneeId ?? ''}
                        onChange={(e) => handleAssigneeChange(task.taskId, e.target.value)}
                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        <option value="">Unassigned</option>
                        {project.members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.fullName}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <span
                            key={tag.tagId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.colorHex }}
                            />
                            {tag.tagName}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>

                    {canDeleteTask && (
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.taskId)}
                          className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskModal
        open={taskModalOpen}
        projectId={project.projectId}
        members={project.members}
        tags={tags}
        onClose={() => setTaskModalOpen(false)}
        onCreated={async () => {
          await Promise.all([loadTasks(), loadProjectAndTags()]);
        }}
      />

      <ManageMembersModal
        open={membersModalOpen}
        projectId={project.projectId}
        ownerId={project.ownerId}
        currentUserRole={currentUserRole}
        members={project.members}
        onClose={() => setMembersModalOpen(false)}
        onUpdated={loadProjectAndTags}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        projectId={project.projectId}
        members={project.members}
        allTags={tags}
        onClose={() => setSelectedTaskId(null)}
        onMutated={async () => {
          await Promise.all([loadTasks(), loadProjectAndTags()]);
        }}
      />
    </div>
  );
}
