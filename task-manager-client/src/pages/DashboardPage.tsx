import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getApiErrorMessage } from '../api/client';
import { dashboardApi } from '../api/dashboardApi';
import { StatusBadge } from '../components/StatusBadge';
import type { DashboardOverview } from '../types/dashboard';

export function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        const res = await dashboardApi.getOverview();
        if (active) setData(res);
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'Failed to load dashboard overview.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500 py-8">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    { label: 'Total Projects', value: data.totalProjects, sub: `${data.activeProjects} active` },
    { label: 'Total Tasks', value: data.totalTasks, sub: 'Across your projects' },
    { label: 'Completed Tasks', value: data.completedTasks, sub: 'Marked Done' },
    {
      label: 'Overdue Tasks',
      value: data.overdueTasks,
      sub: 'Past due & not Done',
      highlight: data.overdueTasks > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of project progress, task completion, and team workload.
          </p>
        </div>
        <Link
          to="/projects"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          View all projects
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs"
          >
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {card.label}
            </div>
            <div
              className={`text-2xl font-semibold mt-2 ${
                card.highlight ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {card.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Your Projects</h2>
            <Link to="/projects" className="text-xs font-medium text-slate-600 hover:text-slate-900">
              Manage →
            </Link>
          </div>

          {data.projects.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              You are not part of any projects yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.projects.map((project) => {
                const progress =
                  project.totalTasks > 0
                    ? Math.round((project.completedTasks / project.totalTasks) * 100)
                    : 0;

                return (
                  <Link
                    key={project.projectId}
                    to={`/projects/${project.projectId}`}
                    className="block py-3.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-900 truncate">
                          {project.projectName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Owner: {project.ownerName} · Due{' '}
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        {project.completedTasks}/{project.totalTasks} done
                      </span>
                      {project.overdueTasks > 0 && (
                        <span className="text-xs font-medium text-rose-600 whitespace-nowrap">
                          {project.overdueTasks} overdue
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Team Workload</h2>

          {data.teamWorkload.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No workload data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="pb-2">Member</th>
                    <th className="pb-2 text-right">Active</th>
                    <th className="pb-2 text-right">Done</th>
                    <th className="pb-2 text-right">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.teamWorkload.map((member) => (
                    <tr key={member.userId}>
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-slate-900">{member.fullName}</div>
                        <div className="text-xs text-slate-500">{member.assignedTasks} total</div>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-700">
                        {member.activeTasks}
                      </td>
                      <td className="py-2.5 text-right text-emerald-700">
                        {member.completedTasks}
                      </td>
                      <td
                        className={`py-2.5 text-right font-medium ${
                          member.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {member.overdueTasks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
