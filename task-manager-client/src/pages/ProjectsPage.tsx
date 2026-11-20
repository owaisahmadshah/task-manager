import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getApiErrorMessage } from '../api/client';
import { projectApi } from '../api/projectApi';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { StatusBadge } from '../components/StatusBadge';
import type { ProjectSummary } from '../types/project';

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setError(null);
      const list = await projectApi.list();
      setProjects(list);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load projects.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a project to manage tasks, team members, and deadlines.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          + New Project
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm text-slate-600 mb-4">No projects found in your workspace.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const pct =
              project.totalTasks > 0
                ? Math.round((project.completedTasks / project.totalTasks) * 100)
                : 0;

            return (
              <Link
                key={project.projectId}
                to={`/projects/${project.projectId}`}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 line-clamp-1">
                      {project.projectName}
                    </h2>
                    <StatusBadge status={project.status} />
                  </div>
                  {project.description && (
                    <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Owner: {project.ownerName}</span>
                    <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">
                        {project.completedTasks} / {project.totalTasks} tasks ({pct}%)
                      </span>
                      {project.overdueTasks > 0 && (
                        <span className="text-rose-600 font-medium">
                          {project.overdueTasks} overdue
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(created) => setProjects((prev) => [created, ...prev])}
      />
    </div>
  );
}
